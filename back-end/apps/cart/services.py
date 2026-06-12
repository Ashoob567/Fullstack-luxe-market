"""
apps/cart/services.py
~~~~~~~~~~~~~~~~~~~~~
Redis-backed cart service for Luxe Market.

Cart key conventions
--------------------
  Logged-in user : cart:{user_id}
  Guest          : cart:guest:{session_key}

TTL
---
  User  : 7 days  (604 800 s)
  Guest : 24 hours (86 400 s)
"""

from __future__ import annotations

import json
import uuid
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

import redis
from django.conf import settings

from apps.coupons.models import Coupon

# ---------------------------------------------------------------------------
# Lazy Redis client (thread-safe singleton)
# ---------------------------------------------------------------------------

_redis_client: redis.Redis | None = None


def _get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )
    return _redis_client


# ---------------------------------------------------------------------------
# TTL constants
# ---------------------------------------------------------------------------

USER_CART_TTL = 7 * 24 * 60 * 60   # 7 days in seconds
GUEST_CART_TTL = 24 * 60 * 60       # 24 hours in seconds
STOCK_RESERVATION_TTL = 15 * 60     # 15 minutes in seconds

FREE_SHIPPING_THRESHOLD = Decimal("3000.00")
SHIPPING_COST = Decimal("200.00")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_EMPTY_CART: dict[str, Any] = {
    "items": [],
    "coupon_code": None,
    "discount_amount": 0,
}


def _ttl_for_key(cart_key: str) -> int:
    """Return the appropriate TTL based on the key prefix."""
    return GUEST_CART_TTL if cart_key.startswith("cart:guest:") else USER_CART_TTL


def _decimal(value: Any) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _serialize_cart(cart: dict) -> str:
    """JSON-encode a cart dict, converting Decimal to string for lossless storage."""
    def _convert(obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return str(obj)
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    return json.dumps(cart, default=_convert)


def _load_cart(raw: str | None) -> dict:
    """Deserialize a JSON cart string; return an empty cart on miss."""
    if not raw:
        return {**_EMPTY_CART, "items": []}
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Product / variant helpers  (import lazily to avoid circular imports)
# ---------------------------------------------------------------------------

def _get_product_and_variant(product_id: str, variant_id: str):
    """
    Return (product, variant) or raise ValueError.

    Adjust the import path to match your actual app structure.
    """
    try:
        from apps.products.models import Product, ProductVariant  # noqa: PLC0415
    except ImportError as exc:
        raise ImportError(
            "Could not import Product/ProductVariant models. "
            "Update the import path inside _get_product_and_variant()."
        ) from exc

    from django.core.exceptions import ValidationError as DjangoValidationError

    try:
        product = Product.objects.get(id=product_id, is_active=True)
    except (Product.DoesNotExist, DjangoValidationError):
        raise ValueError(f"Product '{product_id}' does not exist or is inactive.")

    try:
        variant = ProductVariant.objects.get(id=variant_id, product=product)
    except (ProductVariant.DoesNotExist, DjangoValidationError):
        raise ValueError(
            f"Variant '{variant_id}' does not exist for product '{product_id}'."
        )

    return product, variant


# ---------------------------------------------------------------------------
# CartService
# ---------------------------------------------------------------------------

class CartService:
    """
    All public methods accept *cart_key* as the first positional argument and
    return the (possibly mutated) cart dict, except where noted.
    """

    # ------------------------------------------------------------------
    # Core read / write
    # ------------------------------------------------------------------

    @staticmethod
    def get_cart(cart_key: str) -> dict:
        """Fetch and return the cart stored under *cart_key*.

        Returns an empty cart structure if the key does not exist.
        """
        r = _get_redis()
        raw = r.get(cart_key)
        return _load_cart(raw)

    @staticmethod
    def _save_cart(cart_key: str, cart: dict) -> None:
        r = _get_redis()
        r.set(cart_key, _serialize_cart(cart), ex=_ttl_for_key(cart_key))

    # ------------------------------------------------------------------
    # Items
    # ------------------------------------------------------------------

    @classmethod
    def add_item(
        cls,
        cart_key: str,
        product_id: str,
        variant_id: str,
        quantity: int,
    ) -> dict:
        """
        Add a product variant to the cart.

        - Validates that the product and variant exist in the DB.
        - Checks that sufficient stock is available.
        - If the same variant is already in the cart, increments quantity.
        - Persists the updated cart to Redis.
        """
        if quantity < 1:
            raise ValueError("Quantity must be at least 1.")

        product, variant = _get_product_and_variant(product_id, variant_id)

        cart = cls.get_cart(cart_key)

        # Look for an existing line with the same variant
        existing = next(
            (
                item
                for item in cart["items"]
                if item["product_id"] == str(product_id)
                and item["variant_id"] == str(variant_id)
            ),
            None,
        )

        new_quantity = (existing["quantity"] if existing else 0) + quantity

        if new_quantity > variant.stock_qty:
            raise ValueError(
                f"Only {variant.stock_qty} unit(s) available for this variant "
                f"(you already have {existing['quantity'] if existing else 0} in your cart)."
            )

        if existing:
            existing["quantity"] = new_quantity
        else:
            # Resolve the primary image URL for the cart item
            primary_img = product.images.filter(is_primary=True).first()
            if not primary_img:
                primary_img = product.images.first()
            image_url = (primary_img.image_url if primary_img else "") or ""

            cart["items"].append(
                {
                    "cart_item_id": str(uuid.uuid4()),
                    "product_id": str(product.id),
                    "variant_id": str(variant.id),
                    "name": product.name,
                    "image": image_url,
                    # final_price is a @property: effective_price + price_modifier
                    # Stored as str to avoid float precision loss; parsed back via _decimal()
                    "price": str(_decimal(variant.final_price)),
                    "quantity": quantity,
                    "size": getattr(variant, "size", None) or "",
                    "color": getattr(variant, "color", None) or "",
                }
            )

        cls._save_cart(cart_key, cart)
        return cart

    @classmethod
    def update_item(
        cls,
        cart_key: str,
        cart_item_id: str,
        quantity: int,
    ) -> dict:
        """
        Update the quantity of an existing cart line.

        Raises ValueError if the item is not found or if the requested
        quantity exceeds available stock.
        """
        if quantity < 1:
            raise ValueError("Quantity must be at least 1. Use remove_item() to delete a line.")

        cart = cls.get_cart(cart_key)

        item = next(
            (i for i in cart["items"] if i["cart_item_id"] == cart_item_id),
            None,
        )
        if item is None:
            raise ValueError(f"Cart item '{cart_item_id}' not found.")

        # Re-validate against current stock
        _, variant = _get_product_and_variant(item["product_id"], item["variant_id"])
        if quantity > variant.stock_qty:
            raise ValueError(
                f"Only {variant.stock_qty} unit(s) available for this variant."
            )

        item["quantity"] = quantity
        cls._save_cart(cart_key, cart)
        return cart

    @classmethod
    def remove_item(cls, cart_key: str, cart_item_id: str) -> dict:
        """Remove a single line item from the cart by its *cart_item_id*."""
        cart = cls.get_cart(cart_key)
        original_len = len(cart["items"])
        cart["items"] = [
            i for i in cart["items"] if i["cart_item_id"] != cart_item_id
        ]
        if len(cart["items"]) == original_len:
            raise ValueError(f"Cart item '{cart_item_id}' not found.")

        cls._save_cart(cart_key, cart)
        return cart

    @classmethod
    def clear_cart(cls, cart_key: str) -> bool:
        """
        Delete the cart key from Redis entirely.

        Returns
        -------
        True  — key existed and was deleted.
        False — key did not exist (cart was already empty).
        """
        r = _get_redis()
        deleted_count = r.delete(cart_key)
        return deleted_count > 0

    # ------------------------------------------------------------------
    # Coupon
    # ------------------------------------------------------------------

    @classmethod
    def apply_coupon(cls, cart_key: str, coupon_code: str) -> dict:
        """
        Validate *coupon_code* and apply the resulting discount to the cart.

        Raises ValueError if the coupon does not exist, is inactive, expired,
        exhausted, or the cart subtotal is below the minimum order amount.
        """
        try:
            coupon = Coupon.objects.get(code__iexact=coupon_code)
        except Coupon.DoesNotExist:
            raise ValueError(f"Coupon '{coupon_code}' does not exist.")

        if not coupon.is_valid():
            raise ValueError(
                f"Coupon '{coupon_code}' is not valid (expired, inactive, or fully redeemed)."
            )

        cart = cls.get_cart(cart_key)
        subtotal = cls._subtotal(cart)

        if subtotal < coupon.min_order_amount:
            raise ValueError(
                f"A minimum order of {coupon.min_order_amount} PKR is required "
                f"to use this coupon (your subtotal is {subtotal} PKR)."
            )

        discount = coupon.calculate_discount(subtotal)

        cart["coupon_code"] = coupon.code
        # Store as str for lossless Decimal round-trip
        cart["discount_amount"] = str(discount)

        cls._save_cart(cart_key, cart)
        return cart

    @classmethod
    def remove_coupon(cls, cart_key: str) -> dict:
        """
        Remove any applied coupon from the cart and reset the discount to zero.

        Parameters
        ----------
        cart_key : str
            The Redis key for the cart (resolved by the caller via _get_cart_key).

        Returns
        -------
        The updated cart dict.
        """
        cart = cls.get_cart(cart_key)
        cart["coupon_code"] = None
        cart["discount_amount"] = "0.00"
        cls._save_cart(cart_key, cart)
        return cart

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    @classmethod
    def get_cart_summary(cls, cart: dict) -> dict:
        """
        Compute and return a financial summary for the given cart dict.

        Returns
        -------
        {
            "subtotal":        float,
            "discount_amount": float,
            "shipping":        float,
            "total":           float,
        }
        """
        subtotal = cls._subtotal(cart)
        discount = _decimal(cart.get("discount_amount", 0))
        after_discount = max(subtotal - discount, Decimal("0.00"))
        shipping = (
            Decimal("0.00") if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_COST
        )
        total = after_discount + shipping

        return {
            "subtotal": float(subtotal),
            "discount_amount": float(discount),
            "shipping": float(shipping),
            "total": float(total),
        }

    # ------------------------------------------------------------------
    # Merge
    # ------------------------------------------------------------------

    @classmethod
    def merge_carts(cls, guest_key: str, user_key: str) -> dict:
        """
        Merge the guest cart into the user cart.

        - Items that share the same *variant_id* have their quantities summed,
          capped at the current available stock.
        - Items present only in the guest cart are appended to the user cart.
        - The guest cart key is deleted from Redis after a successful merge.
        - The coupon from the guest cart is carried over only if the user cart
          has no coupon already set.
        """
        guest_cart = cls.get_cart(guest_key)
        user_cart = cls.get_cart(user_key)

        for guest_item in guest_cart["items"]:
            try:
                _, variant = _get_product_and_variant(
                    guest_item["product_id"], guest_item["variant_id"]
                )
            except ValueError:
                # Product/variant was deleted — skip silently.
                continue

            existing = next(
                (
                    i
                    for i in user_cart["items"]
                    if i["variant_id"] == guest_item["variant_id"]
                ),
                None,
            )

            if existing:
                merged_qty = existing["quantity"] + guest_item["quantity"]
                existing["quantity"] = min(merged_qty, variant.stock_qty)
            else:
                # Give the item a fresh cart_item_id in the user cart.
                new_item = {**guest_item, "cart_item_id": str(uuid.uuid4())}
                user_cart["items"].append(new_item)

        # Carry over guest coupon only when user cart has none — re-validate first.
        if not user_cart.get("coupon_code") and guest_cart.get("coupon_code"):
            try:
                # Re-validate: coupon may have expired or been exhausted since guest applied it.
                user_cart = cls.apply_coupon(user_key, guest_cart["coupon_code"])
            except ValueError:
                # Coupon is no longer valid — discard it silently.
                pass

        cls._save_cart(user_key, user_cart)
        _get_redis().delete(guest_key)

        return user_cart

    # ------------------------------------------------------------------
    # Stock Reservation (for checkout)
    # ------------------------------------------------------------------

    @classmethod
    def reserve_stock(cls, cart_key: str, minutes: int = 15) -> dict:
        """
        Reserve stock for the items in the cart during checkout.

        Creates a temporary reservation key in Redis that expires after *minutes*.
        This prevents overselling when multiple users are checking out simultaneously.

        Parameters
        ----------
        cart_key : str
            The Redis key for the cart (e.g., "cart:123" or "cart:guest:abc")
        minutes : int
            How long to hold the reservation (default 15 minutes)

        Returns
        -------
        dict
            {
                "reservation_key": str,
                "expires_in_seconds": int,
                "reserved_items": [
                    {"product_id": str, "variant_id": str, "quantity": int},
                    ...
                ]
            }

        Raises
        ------
        ValueError
            If cart is empty or any variant has insufficient stock.
        """
        cart = cls.get_cart(cart_key)
        if not cart or not cart.get("items"):
            raise ValueError("Cart is empty — nothing to reserve.")

        r = _get_redis()
        ttl_seconds = minutes * 60
        reservation_key = f"{cart_key}:reservation"

        # Check stock availability for all items
        reserved_items = []
        for item in cart["items"]:
            _, variant = _get_product_and_variant(item["product_id"], item["variant_id"])

            # Calculate total reserved quantity for this variant across all carts
            # (excluding the current cart's reservation if it exists)
            pattern = f"cart:*:reservation"
            existing_reservations = 0

            for res_key in r.scan_iter(match=pattern, count=100):
                if res_key == reservation_key:
                    continue  # Skip our own reservation
                res_data = r.get(res_key)
                if res_data:
                    try:
                        res_cart = json.loads(res_data)
                        for res_item in res_cart.get("items", []):
                            if res_item["variant_id"] == item["variant_id"]:
                                existing_reservations += res_item["quantity"]
                    except (json.JSONDecodeError, KeyError):
                        continue

            available_stock = variant.stock_qty - existing_reservations
            if item["quantity"] > available_stock:
                raise ValueError(
                    f"Insufficient stock for {variant.product.name} "
                    f"({variant.size or ''} {variant.color or ''}). "
                    f"Only {available_stock} available (you requested {item['quantity']})."
                )

            reserved_items.append({
                "product_id": item["product_id"],
                "variant_id": item["variant_id"],
                "quantity": item["quantity"],
            })

        # Store the reservation in Redis with TTL
        reservation_data = {"items": reserved_items}
        r.set(reservation_key, _serialize_cart(reservation_data), ex=ttl_seconds)

        return {
            "reservation_key": reservation_key,
            "expires_in_seconds": ttl_seconds,
            "reserved_items": reserved_items,
        }

    @classmethod
    def release_reservation(cls, cart_key: str) -> bool:
        """
        Release a stock reservation before it expires.

        Use this when:
        - User abandons checkout
        - Order creation fails
        - User explicitly cancels checkout

        Parameters
        ----------
        cart_key : str
            The cart key whose reservation should be released

        Returns
        -------
        bool
            True if reservation was released, False if no reservation existed
        """
        r = _get_redis()
        reservation_key = f"{cart_key}:reservation"
        deleted = r.delete(reservation_key)
        return deleted > 0

    @classmethod
    def get_reservation_status(cls, cart_key: str) -> dict | None:
        """
        Check if a reservation exists and how much time remains.

        Returns
        -------
        dict | None
            {
                "reservation_key": str,
                "ttl_seconds": int,
                "expires_at": str (ISO format),
                "reserved_items": list
            }
            or None if no reservation exists.
        """
        r = _get_redis()
        reservation_key = f"{cart_key}:reservation"

        raw = r.get(reservation_key)
        if not raw:
            return None

        ttl = r.ttl(reservation_key)
        if ttl < 0:
            return None  # Key exists but has no TTL or expired

        try:
            reservation_data = json.loads(raw)
        except json.JSONDecodeError:
            return None

        from datetime import datetime, timezone, timedelta
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)

        return {
            "reservation_key": reservation_key,
            "ttl_seconds": ttl,
            "expires_at": expires_at.isoformat(),
            "reserved_items": reservation_data.get("items", []),
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _subtotal(cart: dict) -> Decimal:
        # Start value of Decimal("0.00") ensures the return type is always Decimal,
        # even when the items list is empty (plain sum() would return int 0).
        return sum(
            (
                _decimal(item["price"]) * item["quantity"]
                for item in cart.get("items", [])
            ),
            Decimal("0.00"),
        )