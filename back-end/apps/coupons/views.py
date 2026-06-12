from decimal import Decimal
from django.db.models import F
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics

from .models import Coupon, CouponUsage
from .serializers import (
    CouponValidateSerializer,
    CouponResponseSerializer,
    CouponUsageSerializer,
)


class CouponValidateView(APIView):
    """
    POST /api/coupons/validate/
    Auth: Required (JWT)
    Body: { "code": "SAVE20", "cart_total": 5000.00 }

    Validates a coupon code for the current user and cart total.
    Returns discount breakdown if valid. Returns 400 with reason if invalid.
    Does NOT consume the coupon — consumption happens at payment success.

    Frontend usage:
        User types code → hits "Apply" → POST here → show discount in UI
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code       = serializer.validated_data["code"].upper().strip()
        cart_total = serializer.validated_data["cart_total"]

        # ── fetch coupon ──────────────────────────────────────────────────────
        coupon = Coupon.objects.filter(code=code).first()

        if not coupon:
            return Response(
                {"detail": "Invalid coupon code. Please check and try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── validity checks (ordered: cheapest checks first) ──────────────────
        if not coupon.is_active:
            return Response(
                {"detail": "This coupon is no longer active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.utils import timezone
        now = timezone.now()

        if now < coupon.valid_from:
            return Response(
                {"detail": f"This coupon is not valid yet. It starts on "
                           f"{coupon.valid_from.strftime('%b %d, %Y')}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if now > coupon.valid_until:
            return Response(
                {"detail": "This coupon has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if coupon.max_uses > 0 and coupon.used_count >= coupon.max_uses:
            return Response(
                {"detail": "This coupon has reached its usage limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── per-user limit ────────────────────────────────────────────────────
        if coupon.max_uses_per_user > 0:
            user_uses = CouponUsage.objects.filter(
                coupon=coupon, user=request.user
            ).count()
            if user_uses >= coupon.max_uses_per_user:
                return Response(
                    {"detail": "You have already used this coupon the maximum number of times."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ── minimum order value ───────────────────────────────────────────────
        if coupon.min_order_value > 0 and cart_total < coupon.min_order_value:
            return Response(
                {"detail": f"This coupon requires a minimum order of "
                           f"Rs. {coupon.min_order_value:,.0f}. "
                           f"Add Rs. {coupon.min_order_value - cart_total:,.0f} more to qualify."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── all checks passed — return discount breakdown ─────────────────────
        response_serializer = CouponResponseSerializer(
            coupon,
            context={"cart_total": cart_total, "request": request},
        )
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class CouponPublicListView(generics.ListAPIView):
    """
    GET /api/coupons/active/
    Auth: Required (JWT)

    Returns a list of currently active and valid coupons.
    Frontend can display these as "Available offers" in the cart page.
    Only returns coupons the user hasn't exhausted their per-user limit on.
    """
    permission_classes = [IsAuthenticated]
    pagination_class   = None  # return complete list — never paginated

    def get(self, request, *args, **kwargs):
        from django.utils import timezone
        now = timezone.now()

        # fetch all currently valid coupons
        active_coupons = Coupon.objects.filter(
            is_active=True,
            valid_from__lte=now,
            valid_until__gte=now,
        ).exclude(
            # exclude fully exhausted coupons (where max_uses > 0 and used_count >= max_uses)
            max_uses__gt=0,
            used_count__gte=F("max_uses"),
        )

        # filter out coupons this user has exhausted their personal limit on
        exhausted_ids = []
        for coupon in active_coupons:
            if coupon.max_uses_per_user > 0:
                user_uses = CouponUsage.objects.filter(
                    coupon=coupon, user=request.user
                ).count()
                if user_uses >= coupon.max_uses_per_user:
                    exhausted_ids.append(coupon.id)

        active_coupons = active_coupons.exclude(id__in=exhausted_ids)

        serializer = CouponResponseSerializer(
            active_coupons,
            many=True,
            context={"cart_total": 0, "request": request},
        )
        return Response(serializer.data)


class CouponUsageHistoryView(generics.ListAPIView):
    """
    GET /api/coupons/my-usage/
    Auth: Required (JWT)

    Returns current user's coupon usage history.
    Frontend: shown in account → order history (optional feature).
    """
    serializer_class   = CouponUsageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = None

    def get_queryset(self):
        return CouponUsage.objects.filter(
            user=self.request.user
        ).select_related("coupon", "order")


# ── Admin-only views ──────────────────────────────────────────────────────────

class AdminCouponCreateView(generics.CreateAPIView):
    """
    POST /api/coupons/admin/create/
    Auth: Admin only

    Allows admin to create coupons via API (alternative to Django admin panel).
    """
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        from rest_framework import serializers as drf_serializers

        class AdminCouponCreateSerializer(drf_serializers.ModelSerializer):
            class Meta:
                model  = Coupon
                fields = [
                    "code", "description", "discount_type", "discount_value",
                    "max_uses", "max_uses_per_user", "min_order_value",
                    "max_discount_amount", "valid_from", "valid_until", "is_active",
                ]

        serializer = AdminCouponCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # force code to uppercase
        serializer.validated_data["code"] = serializer.validated_data["code"].upper()
        coupon = serializer.save()

        return Response(
            {"detail": f"Coupon '{coupon.code}' created successfully.", "id": str(coupon.id)},
            status=status.HTTP_201_CREATED,
        )


class AdminCouponStatsView(APIView):
    """
    GET /api/coupons/admin/stats/<code>/
    Auth: Admin only

    Returns usage statistics for a specific coupon.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, code, *args, **kwargs):
        coupon = Coupon.objects.filter(code=code.upper()).first()
        if not coupon:
            return Response({"detail": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)

        usages = CouponUsage.objects.filter(coupon=coupon).select_related("user", "order")

        total_discount_given = sum(u.discount_applied for u in usages)
        unique_users         = usages.values("user").distinct().count()

        return Response({
            "code":                  coupon.code,
            "is_active":             coupon.is_active,
            "is_currently_valid":    coupon.is_valid(),
            "total_uses":            coupon.used_count,
            "max_uses":              coupon.max_uses,
            "uses_remaining":        (coupon.max_uses - coupon.used_count) if coupon.max_uses > 0 else "unlimited",
            "unique_users":          unique_users,
            "total_discount_given":  f"Rs. {total_discount_given:,.2f}",
            "valid_from":            coupon.valid_from,
            "valid_until":           coupon.valid_until,
        })