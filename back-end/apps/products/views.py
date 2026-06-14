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

from .models import Category, Product, ProductImage, Review
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
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
            "images",
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


class ProductDetailView(RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return base_product_queryset()


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
    serializer_class = ProductListSerializer
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
    serializer_class = ProductListSerializer
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
    serializer_class = ProductListSerializer
    pagination_class = ProductPagination

    def get_queryset(self):
        category_slug = self.kwargs.get("slug")
        return (
            Product.objects.filter(
                is_active=True, category__slug=category_slug
            )
            .select_related("category")
            .prefetch_related("images", "variants", "tags")
            .annotate(
                average_rating=Avg("reviews__rating"),
                review_count=Coalesce(Count("reviews"), 0),
            )
        )


class ProductImageUploadView(APIView):
    """
    Upload product images to Supabase Storage.

    POST /api/products/<id>/images/
    Admin only. Accepts multipart/form-data with up to 8 image files.

    Validation:
    - Max file size: 5MB per image
    - Allowed formats: jpg, jpeg, png, webp
    - Max files: 8 per request
    """
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"]
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_FILES = 8

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        files = request.FILES.getlist("images")

        if not files:
            return Response(
                {"error": "No images provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(files) > self.MAX_FILES:
            return Response(
                {"error": f"Maximum {self.MAX_FILES} images allowed per request"},
                status=status.HTTP_400_BAD_REQUEST
            )

        storage = SupabaseStorage()
        uploaded_images = []
        errors = []

        for file in files:
            try:
                # Validate file size
                if file.size > self.MAX_FILE_SIZE:
                    errors.append({
                        "file": file.name,
                        "error": f"File size exceeds 5MB limit ({file.size} bytes)"
                    })
                    continue

                # Validate file format
                file_ext = file.name.split(".")[-1].lower() if "." in file.name else ""
                content_type = file.content_type.lower() if file.content_type else ""

                is_valid_format = (
                    file_ext in self.ALLOWED_FORMATS or
                    content_type in [f"image/{ext}" for ext in self.ALLOWED_FORMATS]
                )

                if not is_valid_format:
                    errors.append({
                        "file": file.name,
                        "error": f"Invalid format. Allowed: {', '.join(self.ALLOWED_FORMATS)}"
                    })
                    continue

                # Generate unique filename
                import uuid
                unique_name = f"{uuid.uuid4().hex}.{file_ext or 'jpg'}"

                # Upload to Supabase
                storage.save(unique_name, file)

                # Get public URL
                public_url = storage.url(unique_name)

                # Create ProductImage instance
                product_image = ProductImage.objects.create(
                    product=product,
                    image_url=public_url,
                    alt_text="",
                    is_primary=product.images.count() == 0,  # First image is primary
                    order=product.images.count()
                )

                uploaded_images.append({
                    "id": str(product_image.id),
                    "url": public_url,
                    "is_primary": product_image.is_primary
                })

                logger.info(f"Uploaded image for product {product.name}: {public_url}")

            except Exception as e:
                logger.error(f"Error uploading image {file.name}: {e}")
                errors.append({
                    "file": file.name,
                    "error": str(e)
                })

        response_data = {
            "uploaded": uploaded_images,
            "product_id": str(product.id)
        }

        if errors:
            response_data["errors"] = errors

        return Response(response_data, status=status.HTTP_201_CREATED)


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