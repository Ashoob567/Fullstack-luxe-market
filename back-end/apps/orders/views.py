"""
apps/orders/views.py

Order management endpoints for Luxe Market.

Endpoints
─────────────────────────────────────────────────────
GET  /api/orders/              UserOrderListView      (JWT required)
GET  /api/orders/<id>/         OrderDetailView        (JWT required)
POST /api/orders/<id>/cancel/  CancelOrderView        (JWT required)
GET  /api/orders/track/        GuestOrderTrackView    (no auth)
"""

import logging
from datetime import timedelta

from django.core.paginator import Paginator

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.orders.serializers import (
    GuestOrderTrackSerializer,
    OrderListSerializer,
    OrderSerializer,
)
from apps.payments.mock_processor import refund_mock_payment

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _estimated_delivery(order: Order) -> str:
    """Return a human-readable estimated delivery string."""
    days = 5 if order.payment_method == Order.PaymentMethod.COD else 3
    delivery_date = order.created_at + timedelta(days=days)
    return delivery_date.strftime("%A, %d %B %Y")


# ── Views ─────────────────────────────────────────────────────────────────────

class UserOrderListView(APIView):
    """
    GET /api/orders/

    Returns a paginated list of the authenticated user's orders,
    newest first — without individual items (use detail view for those).

    Query params:
        page      (int, default 1)
        page_size (int, default 10, max 50)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            page_size = min(int(request.query_params.get("page_size", 10)), 50)
            page_num  = max(int(request.query_params.get("page", 1)), 1)
        except (ValueError, TypeError):
            page_size, page_num = 10, 1

        qs = (
            Order.objects
            .filter(user=request.user)
            .prefetch_related("items")
            .order_by("-created_at")
        )

        paginator = Paginator(qs, page_size)
        page      = paginator.get_page(page_num)

        serializer = OrderListSerializer(page.object_list, many=True)

        return Response(
            {
                "count":       paginator.count,
                "total_pages": paginator.num_pages,
                "page":        page_num,
                "page_size":   page_size,
                "results":     serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class OrderDetailView(APIView):
    """
    GET /api/orders/<id>/

    Returns full order detail including all items and estimated delivery.
    Users can only access their own orders.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, order_id: str):
        try:
            order = (
                Order.objects
                .prefetch_related("items")
                .get(id=order_id, user=request.user)
            )
        except (Order.DoesNotExist, ValueError):
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrderSerializer(order)
        data = serializer.data
        data["estimated_delivery"] = _estimated_delivery(order)
        return Response(data, status=status.HTTP_200_OK)


class CancelOrderView(APIView):
    """
    POST /api/orders/<id>/cancel/

    Cancels an order if it is still in 'pending' or 'confirmed' status.

    - COD orders:       status → cancelled, payment_status unchanged (still pending).
    - Mock card orders: status → cancelled, payment_status → refunded
                        (calls mock refund — always succeeds in dev).

    Response 200: { message, order_id, order_number, refund_issued }
    Response 400: { detail } — already cancelled or not cancellable
    Response 404: { detail } — order not found
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, order_id: str):
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except (Order.DoesNotExist, ValueError):
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.status == Order.Status.CANCELLED:
            return Response(
                {"detail": "This order is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not order.is_cancellable:
            return Response(
                {
                    "detail": (
                        f"Orders with status '{order.get_status_display()}' "
                        "cannot be cancelled. Please contact support."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        refund_issued = False

        # ── Mock card: issue instant mock refund ──────────────────────────────
        if (
            order.payment_method == Order.PaymentMethod.MOCK_CARD
            and order.payment_status == Order.PaymentStatus.PAID
            and order.mock_payment_id
        ):
            try:
                refund_result = refund_mock_payment(order.mock_payment_id)
                logger.info(
                    "Mock refund %s issued for order %s.",
                    refund_result.get("refund_id"), order.order_number,
                )
                order.payment_status = Order.PaymentStatus.REFUNDED
                refund_issued = True
            except Exception as exc:
                logger.exception("Mock refund failed for order %s: %s", order.order_number, exc)
                # Don't block cancellation — refund can be retried manually.

        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status", "payment_status", "updated_at"])

        logger.info(
            "Order %s cancelled by user %s (refund_issued=%s).",
            order.order_number, request.user.id, refund_issued,
        )

        return Response(
            {
                "message":        f"Order {order.order_number} has been cancelled.",
                "order_id":       str(order.id),
                "order_number":   order.order_number,
                "refund_issued":  refund_issued,
                "payment_status": order.payment_status,
            },
            status=status.HTTP_200_OK,
        )


class GuestOrderTrackView(APIView):
    """
    GET /api/orders/track/?email=<email>&order_id=<uuid>

    Lets guests (or anyone) track an order without authentication.
    Requires both email and order_id to match — acts as a simple secret.

    Returns a limited public view of the order (no full address, no items detail).
    """

    permission_classes = [AllowAny]

    def get(self, request):
        email    = request.query_params.get("email", "").strip().lower()
        order_id = request.query_params.get("order_id", "").strip()

        if not email or not order_id:
            return Response(
                {"detail": "Both 'email' and 'order_id' query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Match against authenticated user email OR guest_email
        try:
            order = Order.objects.get(id=order_id)
        except (Order.DoesNotExist, ValueError):
            return Response(
                {"detail": "Order not found. Check your order ID and email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify email matches
        order_email = (
            order.user.email.lower() if order.user
            else (order.guest_email or "").lower()
        )
        if order_email != email:
            return Response(
                {"detail": "Order not found. Check your order ID and email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = GuestOrderTrackSerializer(order)
        data = serializer.data
        data["estimated_delivery"] = _estimated_delivery(order)
        return Response(data, status=status.HTTP_200_OK)
