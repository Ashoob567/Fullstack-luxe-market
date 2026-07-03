"""
Checkout business logic - cart validation, payment, order creation.

Responsibilities:
  - Resolve cart (Redis or request payload)
  - Calculate totals (subtotal, shipping, tax, total)
  - Process payment (mock gateway or COD)
  - Create order + line items atomically
  - Enforce idempotency (unique constraint on idempotency_key)

All database writes happen inside transaction.atomic().
If payment succeeds but order creation fails, the payment is NOT reversed
(manual reconciliation required - logged as critical error).
"""

import uuid
from decimal import Decimal
from typing import Dict, List, Optional
from contextlib import contextmanager

import structlog
from django.db import transaction, IntegrityError
from django.core.cache import cache

from apps.orders.models import Order, OrderItem
from apps.payments.mock_gateway import create_mock_payment_intent, confirm_mock_payment

logger = structlog.get_logger(__name__)


# --- Custom Exceptions ---

class CheckoutError(Exception):
    """
    Base exception for expected checkout failures.

    Attributes:
        message: Human-readable error
        code: Machine-readable code (for frontend logic)
        status: HTTP status code to return
    """
    def __init__(self, message: str, code: str = "checkout_error", status: int = 400):
        self.message = message
        self.code = code
        self.status = status
        super().__init__(message)


class EmptyCartError(CheckoutError):
    def __init__(self):
        super().__init__("Your cart is empty.", code="empty_cart", status=400)


class PaymentDeclinedError(CheckoutError):
    def __init__(self, reason: str = "Payment declined."):
        super().__init__(reason, code="payment_declined", status=402)


# --- Cart Resolution ---

def resolve_cart(
    cart_key: str,
    fallback_items: Optional[List[Dict]] = None,
) -> Dict:
    """
    Fetch cart from Redis. For guests, fall back to request payload if expired.

    Args:
        cart_key: Redis key (e.g., "cart:user_42" or "cart:guest:uuid")
        fallback_items: Cart snapshot from request (guest checkout only)

    Returns:
        {"items": [...], "subtotal": Decimal}

    Raises:
        EmptyCartError: No cart found in Redis or fallback
    """
    cart = cache.get(cart_key)

    if not cart or not cart.get("items"):
        if fallback_items:
            logger.info(
                "cart_fallback_used",
                cart_key=cart_key,
                item_count=len(fallback_items),
            )
            cart = {"items": fallback_items}
        else:
            logger.warning("cart_not_found", cart_key=cart_key)
            raise EmptyCartError()

    return cart


# --- Order Creation ---

@contextmanager
def _record_order_creation_time():
    """Context manager to record order creation latency."""
    from apps.core.monitoring import order_creation_latency
    import time

    start = time.time()
    try:
        yield
    finally:
        duration = time.time() - start
        order_creation_latency.observe(duration)


@transaction.atomic
def create_order(
    *,
    user: Optional,
    cart: Dict,
    shipping_address: Dict,
    payment_method: str,
    card_number: Optional[str],
    is_discreet: bool,
    notes: Optional[str],
    guest_email: Optional[str],
    idempotency_key: uuid.UUID,
    contact_type: str,
) -> Order:
    """
    Create an order atomically with idempotency.

    Flow:
      1. Check for existing order with same idempotency_key (safe retry)
      2. Calculate totals
      3. Process payment (COD or mock card)
      4. Create Order + OrderItem records
      5. Return order summary

    Args:
        user: Authenticated user (None for guest)
        cart: Cart data with items
        shipping_address: Validated address dict
        payment_method: "cod" or "mock_card"
        card_number: Card number (re-entered at verify time, never stored)
        is_discreet: Discreet packaging flag
        notes: Customer notes
        guest_email: Email for guest orders
        idempotency_key: UUID (generated once at checkout start)
        contact_type: "email" or "phone" (for logging)

    Returns:
        Order instance

    Raises:
        CheckoutError: On payment failure or validation error
        PaymentDeclinedError: Card declined
    """
    from apps.core.monitoring import order_creation_counter

    with _record_order_creation_time():

        # --- Idempotency Check ---
        existing = Order.objects.filter(idempotency_key=idempotency_key).first()
        if existing:
            logger.info(
                "duplicate_order_request",
                order_number=existing.order_number,
                idempotency_key=str(idempotency_key),
            )
            order_creation_counter.labels(
                payment_method=payment_method,
                status="duplicate",
            ).inc()
            return existing

        # --- Calculate Totals ---
        totals = _calculate_totals(cart)

        # --- COD Path ---
        if payment_method == "cod":
            try:
                order = _create_order_and_items(
                    user=user,
                    cart=cart,
                    totals=totals,
                    shipping_address=shipping_address,
                    payment_method=Order.PaymentMethod.COD,
                    payment_status=Order.PaymentStatus.PENDING,
                    order_status=Order.Status.CONFIRMED,
                    mock_payment_id=None,
                    is_discreet=is_discreet,
                    notes=notes,
                    guest_email=guest_email,
                    idempotency_key=idempotency_key,
                )

                logger.info(
                    "order_created_cod",
                    order_number=order.order_number,
                    total=str(totals["total_amount"]),
                    contact_type=contact_type,
                )

                order_creation_counter.labels(
                    payment_method="cod",
                    status="success",
                ).inc()

                return order

            except IntegrityError:
                # Race condition - another request committed first
                logger.warning(
                    "order_creation_race_condition",
                    idempotency_key=str(idempotency_key),
                )
                return Order.objects.get(idempotency_key=idempotency_key)

            except Exception as exc:
                logger.exception("cod_order_creation_failed", error=str(exc))
                order_creation_counter.labels(
                    payment_method="cod",
                    status="error",
                ).inc()
                raise CheckoutError(
                    "Could not place your order. Please try again.",
                    status=500,
                )

        # --- Mock Card Path ---
        if not card_number or len(card_number.replace(" ", "").replace("-", "")) < 12:
            raise CheckoutError(
                "A valid card number is required for card payments.",
                code="invalid_card",
            )

        customer_id = user.id if user else guest_email

        # Create payment intent
        try:
            intent = create_mock_payment_intent(
                amount_pkr=float(totals["total_amount"]),
                metadata={"customer_id": str(customer_id)},
            )
        except Exception as exc:
            logger.error("payment_intent_creation_failed", error=str(exc))
            raise CheckoutError("Payment service unavailable.", status=503)

        # Confirm payment
        result = confirm_mock_payment(intent_id=intent["id"], card_number=card_number)

        if result["status"] == "failed":
            logger.info(
                "payment_declined",
                customer_id=customer_id,
                reason=result.get("error"),
            )
            order_creation_counter.labels(
                payment_method="mock_card",
                status="payment_failed",
            ).inc()
            raise PaymentDeclinedError(result.get("error", "Payment declined."))

        # Create order after successful payment
        try:
            order = _create_order_and_items(
                user=user,
                cart=cart,
                totals=totals,
                shipping_address=shipping_address,
                payment_method=Order.PaymentMethod.MOCK_CARD,
                payment_status=Order.PaymentStatus.PAID,
                order_status=Order.Status.CONFIRMED,
                mock_payment_id=intent["id"],
                is_discreet=is_discreet,
                notes=notes,
                guest_email=guest_email,
                idempotency_key=idempotency_key,
            )

            logger.info(
                "order_created_card",
                order_number=order.order_number,
                payment_id=intent["id"],
                total=str(totals["total_amount"]),
                contact_type=contact_type,
            )

            order_creation_counter.labels(
                payment_method="mock_card",
                status="success",
            ).inc()

            return order

        except IntegrityError:
            return Order.objects.get(idempotency_key=idempotency_key)

        except Exception as exc:
            # ⚠️ CRITICAL: Payment succeeded but order failed
            # This requires manual reconciliation (refund or retry)
            logger.critical(
                "order_creation_after_payment_failed",
                payment_id=intent["id"],
                customer_id=customer_id,
                error=str(exc),
                action_required="Manual refund or order creation",
            )
            order_creation_counter.labels(
                payment_method="mock_card",
                status="critical_error",
            ).inc()
            raise CheckoutError(
                "Payment succeeded but order could not be saved. "
                "Please contact support with reference: " + intent["id"],
                status=500,
            )


# --- Helper Functions ---

def _calculate_totals(cart: Dict) -> Dict:
    """
    Calculate order totals from cart items.

    Returns:
        {
            "subtotal": Decimal,
            "shipping_fee": Decimal,
            "tax": Decimal,
            "total_amount": Decimal,
        }
    """
    subtotal = Decimal("0.00")

    for item in cart["items"]:
        price = Decimal(str(item["unit_price"]))
        qty = item["quantity"]
        subtotal += price * qty

    # TODO: Make these configurable in settings
    shipping_fee = Decimal("200.00") if subtotal < Decimal("3000.00") else Decimal("0.00")
    tax = subtotal * Decimal("0.00")  # Update when tax rules are defined
    total_amount = subtotal + shipping_fee + tax

    return {
        "subtotal": subtotal,
        "shipping_fee": shipping_fee,
        "tax": tax,
        "total_amount": total_amount,
    }


def _create_order_and_items(
    *,
    user,
    cart: Dict,
    totals: Dict,
    shipping_address: Dict,
    payment_method: str,
    payment_status: str,
    order_status: str,
    mock_payment_id: Optional[str],
    is_discreet: bool,
    notes: Optional[str],
    guest_email: Optional[str],
    idempotency_key: uuid.UUID,
) -> Order:
    """
    Create Order + OrderItem records in a single transaction.

    MUST be called inside transaction.atomic() block.
    """
    order = Order.objects.create(
        user=user,
        guest_email=guest_email,
        # Shipping address - store as JSON for now
        shipping_address=shipping_address,
        # Financials
        subtotal=totals["subtotal"],
        shipping_amount=totals["shipping_fee"],
        total_amount=totals["total_amount"],
        # Payment
        payment_method=payment_method,
        payment_status=payment_status,
        mock_payment_id=mock_payment_id,
        # Status
        status=order_status,
        is_discreet=is_discreet,
        notes=notes,
        # Idempotency
        idempotency_key=idempotency_key,
    )

    # Create line items
    for item in cart["items"]:
        OrderItem.objects.create(
            order=order,
            product_id=item["product_id"],
            variant_id=item.get("variant_id"),
            product_name_snapshot=item["product_name"],
            variant_info_snapshot=item.get("variant_info", {}),
            unit_price=Decimal(str(item["unit_price"])),
            quantity=item["quantity"],
        )

    return order


def clear_cart(cart_key: str):
    """Delete cart from Redis after successful order."""
    try:
        cache.delete(cart_key)
        logger.info("cart_cleared", cart_key=cart_key)
    except Exception as exc:
        # Non-critical - log but don't fail the request
        logger.warning("cart_clear_failed", cart_key=cart_key, error=str(exc))
