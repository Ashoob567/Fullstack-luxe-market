from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics

from apps.products.models import Product
from .models import Wishlist
from .serializers import (
    WishlistItemSerializer,
    WishlistToggleSerializer,
    WishlistBulkStatusSerializer,
)


class WishlistListView(generics.ListAPIView):
    """
    GET /api/wishlist/
    Returns all wishlist items for the authenticated user.
    Each item contains full product details (same shape as product listing).

    Response:
    [
        {
            "id": "uuid",
            "product": { ...ProductListSerializer fields... },
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
    """
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class=None

    def get_queryset(self):
        return (
            Wishlist.objects.filter(user=self.request.user)
            .select_related(
                "product",
                "product__category",
            )
            .prefetch_related(
                "product__images",
                "product__variants",
                "product__tags",
            )
        )


class WishlistToggleView(APIView):
    """
    POST /api/wishlist/toggle/
    Body: { "product_id": "<uuid>" }

    Heart icon toggle — single endpoint for both add and remove:
    - Product NOT in wishlist → adds it   → 201 + { "action": "added" }
    - Product IS in wishlist  → removes it → 200 + { "action": "removed" }

    Frontend usage:
        const res = await api.post('/api/wishlist/toggle/', { product_id })
        if (res.data.action === 'added') setIsWishlisted(true)
        else setIsWishlisted(false)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = WishlistToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data["product_id"]
        product = Product.objects.get(id=product_id)

        existing = Wishlist.objects.filter(
            user=request.user,
            product=product,
        ).first()

        if existing:
            existing.delete()
            return Response(
                {
                    "action": "removed",
                    "product_id": str(product_id),
                    "message": f"'{product.name}' removed from wishlist.",
                },
                status=status.HTTP_200_OK,
            )

        Wishlist.objects.create(user=request.user, product=product)
        return Response(
            {
                "action": "added",
                "product_id": str(product_id),
                "message": f"'{product.name}' added to wishlist.",
            },
            status=status.HTTP_201_CREATED,
        )


class WishlistStatusView(APIView):
    """
    GET /api/wishlist/status/?product_id=<uuid>
    Returns whether a single product is in the user's wishlist.

    Used by ProductDetail page to show correct heart state on page load.

    Response: { "product_id": "<uuid>", "is_wishlisted": true }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        product_id = request.query_params.get("product_id")

        if not product_id:
            return Response(
                {"detail": "product_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_wishlisted = Wishlist.objects.filter(
            user=request.user,
            product_id=product_id,
        ).exists()

        return Response({
            "product_id": product_id,
            "is_wishlisted": is_wishlisted,
        })


class WishlistBulkStatusView(APIView):
    """
    POST /api/wishlist/bulk-status/
    Body: { "product_ids": ["uuid1", "uuid2", "uuid3"] }

    Returns wishlist status for multiple products in one request.
    Used when rendering ProductGrid — avoids N individual status calls.
    Max 100 product IDs per request.

    Response:
    {
        "wishlist_status": {
            "uuid1": true,
            "uuid2": false,
            "uuid3": true
        }
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = WishlistBulkStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_ids = serializer.validated_data["product_ids"]

        # single DB query — get all wishlisted IDs from this list
        wishlisted_ids = set(
            Wishlist.objects.filter(
                user=request.user,
                product_id__in=product_ids,
            ).values_list("product_id", flat=True)
        )

        result = {
            str(pid): (pid in wishlisted_ids)
            for pid in product_ids
        }

        return Response({"wishlist_status": result})


class WishlistClearView(APIView):
    """
    DELETE /api/wishlist/clear/
    Removes ALL items from the authenticated user's wishlist.

    Response: { "message": "Wishlist cleared. 5 item(s) removed.", "deleted_count": 5 }
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        deleted_count, _ = Wishlist.objects.filter(
            user=request.user
        ).delete()

        return Response(
            {
                "message": f"Wishlist cleared. {deleted_count} item(s) removed.",
                "deleted_count": deleted_count,
            },
            status=status.HTTP_200_OK,
        )
