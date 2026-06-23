"""
apps/payments/views.py

Payment endpoints for Luxe Market (mock / dev mode).
No Stripe, no external calls — everything is handled by mock_processor.py.

Endpoints
─────────────────────────────────────────────────────
POST /api/payments/create-intent/     CreatePaymentIntentView
GET  /api/payments/mock-status/<id>/  MockPaymentStatusView
"""

import json
import logging
from decimal import Decimal

from django.conf import settings
from django.core.cache import cache

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework.permissions import IsAuthenticated
from django_q.tasks import async_task

from apps.orders.models import Order, OrderItem
from apps.payments.mock_processor import (
    confirm_mock_payment,
    create_mock_payment_intent,
    get_mock_intent_status,
)

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

SHIPPING_FLAT_RATE = Decimal("200.00")   # PKR — adjust as needed
FREE_SHIPPING_THRESHOLD = Decimal("3000.00")


def _get_cart(cart_key: str) -> dict:
    """
    Fetch the cart from Redis.
    Expected Redis structure:
        key  → "cart:{user_id}" or "cart:guest:{guest_id}"
        value→ JSON: {
            "items": [
                {
                    "product_id": 1,
                    "variant_id": 2,
                    "product_name": "Silk Kurta",
                    "variant_info": {"size": "M", "color": "Navy"},
                    "unit_price": "1500.00",
                    "quantity": 2,
                    "image_url": "..."
                },
                ...
            ],
            "coupon_code": "SAVE10",      # optional
            "discount_amount": "150.00"   # optional
        }
    """
    raw = cache.get(cart_key)
    if not raw:
        return {}
    return json.loads(raw) if isinstance(raw, str) else raw


def _clear_cart(cart_key: str) -> None:
    cache.delete(cart_key)


def _calculate_totals(cart: dict) -> dict:
    """Return subtotal, discount, shipping, total as Decimals."""
    items = cart.get("items", [])
    subtotal = sum(
        Decimal(str(item["unit_price"])) * int(item["quantity"])
        for item in items
    )
    discount = Decimal(str(cart.get("discount_amount", "0")))
    shipping = (
        Decimal("0")
        if subtotal >= FREE_SHIPPING_THRESHOLD
        else SHIPPING_FLAT_RATE
    )
    total = subtotal - discount + shipping
    return {
        "subtotal":        subtotal,
        "discount_amount": discount,
        "shipping_amount": shipping,
        "total_amount":    total,
        "coupon_code":     cart.get("coupon_code"),
    }


def _build_order_summary(order: Order) -> dict:
    return {
        "order_id":      str(order.id),
        "order_number":  order.order_number,
        "status":        order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "subtotal":       str(order.subtotal),
        "discount":       str(order.discount_amount),
        "shipping":       str(order.shipping_amount),
        "total":          str(order.total_amount),
        "currency":       "PKR",
        "items": [
            {
                "name":         item.product_name_snapshot,
                "variant":      item.variant_info_snapshot,
                "unit_price":   str(item.unit_price),
                "quantity":     item.quantity,
                "subtotal":     str(item.subtotal),
            }
            for item in order.items.all()
        ],
    }

@transaction.atomic
def _create_order_and_items(
    user,
    cart: dict,
    totals: dict,
    shipping_address: dict,
    payment_method: str,
    payment_status: str,
    order_status: str,
    mock_payment_id: str | None,
    is_discreet: bool,
    notes: str | None,
    guest_email: str | None = None,
) -> Order:
    """
    Persist the Order + OrderItems and reduce stock.
    Wrapped in a try/except at the call-site.
    """
    with transaction.atomic():
        order = Order.objects.create(
        user=user,
        guest_email=guest_email,
        status=order_status,
        payment_method=payment_method,
        payment_status=payment_status,
        mock_payment_id=mock_payment_id,
        subtotal=totals["subtotal"],
        discount_amount=totals["discount_amount"],
        shipping_amount=totals["shipping_amount"],
        total_amount=totals["total_amount"],
        coupon_code=totals["coupon_code"],
        shipping_address=shipping_address,
        is_discreet=is_discreet,
        notes=notes,
    )

    for item in cart.get("items", []):
        unit_price = Decimal(str(item["unit_price"]))
        quantity   = int(item["quantity"])

        OrderItem.objects.create(
            order=order,
            product_id=item.get("product_id"),
            variant_id=item.get("variant_id"),
            product_name_snapshot=item.get("product_name", ""),
            variant_info_snapshot=item.get("variant_info", {}),
            unit_price=unit_price,
            quantity=quantity,
        )

        # ── Reduce stock ──────────────────────────────────────────────────
        # Import here to avoid circular imports.
        from apps.products.models import ProductSizeVariant
        try:
            variant = ProductSizeVariant.objects.select_for_update().get(
                pk=item["variant_id"]
            )
            variant.stock_quantity = max(0, variant.stock_quantity - quantity)
            variant.save(update_fields=["stock_quantity"])
        except Exception:
            logger.warning(
                "Could not reduce stock for variant %s — skipping.",
                item.get("variant_id"),
            )

    return order


# ── Views ─────────────────────────────────────────────────────────────────────
@method_decorator(ratelimit(key='user', rate='10/m', method='POST', block=True), name='post')
class CreatePaymentIntentView(APIView):
    """
    POST /api/payments/create-intent/

    Request body (JSON):
    {
        "shipping_address": {
            "firstName": "Ali",
            "lastName":  "Khan",
            "phone":     "03001234567",
            "streetAddress": "123 Main St",
            "city":      "Lahore",
            "province":  "Punjab",
            "postalCode": "54000",
            "email":     "guest@example.com"  // required for guest users
        },
        "payment_method": "mock_card" | "cod",
        "card_number":    "4242424242424242",   // mock_card only
        "is_discreet":    false,
        "notes":          "Leave at gate",      // optional
        "cart_id":        "guest_abc123",       // required for guest users
        "cart_items":     [...]                 // optional for guest users (if cart not in Redis)
    }

    Responses:
        200 { status: "success", order_id, order_summary }
        402 { status: "failed",  error }
        400 { detail: "..." }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        # ── 1. Determine user context (authenticated or guest) ────────────────
        is_authenticated = request.user and request.user.is_authenticated

        if is_authenticated:
            cart_key = f"cart:{request.user.id}"
            user = request.user
            guest_email = None
        else:
            # Guest checkout
            cart_id = data.get("cart_id")
            if not cart_id:
                return Response(
                    {"detail": "cart_id is required for guest checkout."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            cart_key = f"cart:guest:{cart_id}"
            user = None
            guest_email = None  # Will be extracted from shipping_address

        # ── 2. Validate required fields ───────────────────────────────────────
        shipping_address = data.get("shipping_address")
        payment_method   = data.get("payment_method")

        if not shipping_address or not isinstance(shipping_address, dict):
            return Response(
                {"detail": "shipping_address is required and must be an object."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        required_address_fields = [
            "firstName", "lastName", "phone",
            "streetAddress", "city", "province", "postalCode",
        ]
        missing = [f for f in required_address_fields if not shipping_address.get(f)]
        if missing:
            return Response(
                {"detail": f"Missing address fields: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extract guest email if not authenticated
        if not is_authenticated:
            guest_email = shipping_address.get("email")
            if not guest_email:
                return Response(
                    {"detail": "email is required in shipping_address for guest checkout."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if payment_method not in ("mock_card", "cod"):
            return Response(
                {"detail": "payment_method must be 'mock_card' or 'cod'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 3. Fetch & validate cart ──────────────────────────────────────────
        cart = _get_cart(cart_key)

        # For guest users: if cart not in Redis, accept cart_items from request
        if (not cart or not cart.get("items")) and not is_authenticated:
            cart_items = data.get("cart_items")
            if cart_items and isinstance(cart_items, list) and len(cart_items) > 0:
                cart = {"items": cart_items}
            else:
                return Response(
                    {"detail": "Your cart is empty. Please add items before checkout."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif not cart or not cart.get("items"):
            return Response(
                {"detail": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totals      = _calculate_totals(cart)
        is_discreet = bool(data.get("is_discreet", False))
        notes       = data.get("notes") or None

        # ── 4a. Cash on Delivery ──────────────────────────────────────────────
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
                )
            except Exception as exc:
                logger.exception("COD order creation failed: %s", exc)
                return Response(
                    {"detail": "Could not place your order. Please try again."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            _clear_cart(cart_key)
            customer_id = user.id if user else guest_email
            logger.info("COD order %s created for customer %s.", order.order_number, customer_id)

            # ── Async Task: Send order confirmation email ──
            async_task(
                'apps.orders.tasks.send_order_confirmation_email',
                str(order.id),
                task_name=f'order_confirmation_{order.order_number}'
            )

            return Response(
                {
                    "status":        "success",
                    "order_id":      str(order.id),
                    "order_summary": _build_order_summary(order),
                },
                status=status.HTTP_200_OK,
            )

        # ── 4b. Mock Card Payment ─────────────────────────────────────────────
        card_number = str(data.get("card_number", "")).replace(" ", "").replace("-", "")
        if not card_number or len(card_number) < 12:
            return Response(
                {"detail": "A valid card_number is required for mock_card payments."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step i — create intent (generates fake IDs)
        customer_id = user.id if user else guest_email
        intent = create_mock_payment_intent(
            amount_pkr=float(totals["total_amount"]),
            metadata={"customer_id": customer_id, "cart_key": cart_key},
        )

        # Step ii — attempt confirmation
        result = confirm_mock_payment(
            intent_id=intent["id"],
            card_number=card_number,
        )

        if result["status"] == "failed":
            logger.info(
                "Mock card payment failed for customer %s: %s",
                customer_id, result.get("error"),
            )
            return Response(
                {"status": "failed", "error": result.get("error", "Payment failed.")},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # Step iii — payment succeeded → persist order
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
            )
        except Exception as exc:
            logger.exception("Order creation after successful mock payment failed: %s", exc)
            return Response(
                {"detail": "Payment succeeded but order could not be saved. Contact support."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        _clear_cart(cart_key)
        logger.info(
            "Mock card order %s created for customer %s (intent: %s).",
            order.order_number, customer_id, intent["id"],
        )

        # ── Async Task: Send order confirmation email ──
        async_task(
            'apps.orders.tasks.send_order_confirmation_email',
            str(order.id),
            task_name=f'order_confirmation_{order.order_number}'
        )

        return Response(
            {
                "status":        "success",
                "order_id":      str(order.id),
                "order_summary": _build_order_summary(order),
            },
            status=status.HTTP_200_OK,
        )


class MockPaymentStatusView(APIView):
    """
    GET /api/payments/mock-status/<intent_id>/

    Returns the payment status by looking up the Order that holds
    this mock_payment_intent_id.  Useful for frontend polling / debugging.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, intent_id: str):
        try:
            order = Order.objects.get(
                mock_payment_id=intent_id,
                user=request.user,          # users can only see their own orders
            )
        except Order.DoesNotExist:
            return Response(
                {"detail": "No order found for this payment intent."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "intent_id":      intent_id,
                "payment_status": order.payment_status,
                "order_status":   order.status,
                "order_id":       str(order.id),
                "order_number":   order.order_number,
            },
            status=status.HTTP_200_OK,
        )