import logging
import uuid
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from django.db import IntegrityError
from django.db.models import Avg, Count, Sum
from django.db.models.functions import Coalesce
from django.conf import settings
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.exceptions import ValidationError

from .models import Category, Product, Review
from .serializers import (
    CategorySerializer,
    ProductListSerializerNew,  # NEW: Normalized structure (color → size)
    ReviewSerializer
)
from .pagination import ProductPagination
from .filters import ProductFilter
from utils.storage import SupabaseStorage

logger = logging.getLogger(__name__)


def base_product_queryset():
    """
    Base queryset for products with optimized prefetch.

    Uses NEW normalized structure:
    - color_variants_new → size_variants (nested prefetch)
    - Image stored once per color (efficient!)
    """
    return (
        Product.objects.filter(is_active=True)
        .select_related("category")
        .prefetch_related(
            "color_variants_new__size_variants",  # NEW: Nested prefetch for normalized structure
            "tags",
            "reviews"
        )
        .annotate(
            average_rating=Avg("reviews__rating"),
            review_count=Coalesce(Count("reviews"), 0),
        )
    )


@method_decorator(cache_page(60 * 15), name='dispatch')  # Cache for 15 minutes
class CategoryListView(ListAPIView):
    serializer_class = CategorySerializer
    pagination_class = None  # Return all categories as a flat array (no pagination)

    def get_queryset(self):
        return Category.objects.filter(
            parent__isnull=True, is_active=True
        ).prefetch_related("children")


@method_decorator(cache_page(60 * 15), name='dispatch')  # Cache for 15 minutes
class CategoryDetailView(RetrieveAPIView):
    serializer_class = CategorySerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Category.objects.filter(is_active=True)


class ProductListView(ListAPIView):
    """
    Product list API - Returns products with normalized color → size structure.
    Used by: /products/ page, category pages, search results.
    """
    serializer_class = ProductListSerializerNew  # ✅ Uses normalized structure
    pagination_class = ProductPagination
    filterset_class = ProductFilter
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["base_price", "created_at", "name"]

    def get_queryset(self):
        return base_product_queryset()

'''
class ProductDetailView(RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return base_product_queryset()
'''

class FeaturedProductsView(ListAPIView):
    """
    Featured products API - Returns featured products with normalized structure.
    Used by: Home page featured section.
    """
    serializer_class = ProductListSerializerNew  # ✅ Uses normalized structure
    pagination_class = None  # Return flat array — no pagination wrapper

    def get_queryset(self):
        # Slicing here would raise "Cannot filter a query once a slice has been taken"
        # because ListAPIView calls filter_queryset() and paginate_queryset() internally.
        return base_product_queryset().filter(is_featured=True)

    def list(self, request, *args, **kwargs):
        cache_key = 'featured_products_list'
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset[:8], many=True)
        cache.set(cache_key, serializer.data, 60 * 10)  # Cache for 10 minutes
        return Response(serializer.data)


class NewArrivalsView(ListAPIView):
    serializer_class = ProductListSerializerNew  # ✅ Use NEW structure with color_variants_new
    pagination_class = None

    def get_queryset(self):
        # Filter products with "new-arrival" tag (case-insensitive slug match)
        return base_product_queryset().filter(
            tags__slug__iexact="new-arrival"
        ).distinct().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        cache_key = 'new_arrivals_list'
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset[:8], many=True)
        cache.set(cache_key, serializer.data, 60 * 10)  # Cache for 10 minutes
        return Response(serializer.data)


class BestsellersView(ListAPIView):
    serializer_class = ProductListSerializerNew
    pagination_class = None

    def get_queryset(self):
        return (
            base_product_queryset()
            .annotate(sales_count=Count("order_items"))
            .order_by("-sales_count")
        )

    def list(self, request, *args, **kwargs):
        cache_key = 'bestsellers_list'
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset[:8], many=True)
        cache.set(cache_key, serializer.data, 60 * 15)  # Cache for 15 minutes
        return Response(serializer.data)


class FlashSaleView(ListAPIView):
    serializer_class = ProductListSerializerNew
    pagination_class = ProductPagination

    def get_queryset(self):
        from django.utils import timezone
        from django.db.models import Q
        return (
            base_product_queryset()
            .filter(
                is_flash_sale=True,
                is_active=True,
            )
            .filter(
                # no end date set  OR  end date is in the future
                Q(flash_sale_ends_at__isnull=True) | Q(flash_sale_ends_at__gt=timezone.now())
            )
        )


class CategoryProductsView(ListAPIView):
    serializer_class = ProductListSerializerNew
    pagination_class = ProductPagination

    def get_queryset(self):
        category_slug = self.kwargs.get("slug")
        return (
            Product.objects.filter(
                is_active=True, category__slug=category_slug
            )
            .select_related("category")
            .prefetch_related("color_variants_new__size_variants", "tags")
            .annotate(
                average_rating=Avg("reviews__rating"),
                review_count=Coalesce(Count("reviews"), 0),
            )
        )


# ==================================================
# DEPRECATED: ProductImageUploadView (uses old ProductImage model)
# Images now uploaded directly via Django Admin on ProductColorVariant
# ==================================================
''''
class ProductImageUploadView(APIView):
    """
    DEPRECATED: Images are now uploaded via Django Admin on ProductColorVariant.
    Each color variant has its own image attached directly.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        return Response(
            {
                "error": "This endpoint is deprecated. Upload images via Django Admin on Product Color Variants.",
                "detail": "Each color variant now has its own image field. Go to Admin → Products → Select Product → Add Color Variant with image."
            },
            status=status.HTTP_410_GONE
        )

    def get(self, request, pk):
        return Response(
            {
                "message": "This endpoint is deprecated.",
                "replacement": "Images are now part of ProductColorVariant model."
            },
            status=status.HTTP_410_GONE
        )

'''
# ==================================================
# REVIEW VIEWS
# ==================================================

class ReviewListView(ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Review.objects.all().select_related("user", "product")


class ReviewCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save(user=self.request.user)
            except IntegrityError:
                raise ValidationError({
                    'detail': 'You have already submitted a review for this product.'
                })
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)