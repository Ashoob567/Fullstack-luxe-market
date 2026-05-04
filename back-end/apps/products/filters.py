import django_filters
from django.db.models import F, Count

from .models import Product


class ProductFilter(django_filters.FilterSet):

    # =========================
    # BASIC FILTERS
    # =========================

    category = django_filters.CharFilter(field_name="category__slug")

    min_price = django_filters.NumberFilter(
        field_name="base_price",
        lookup_expr="gte"
    )

    max_price = django_filters.NumberFilter(
        field_name="base_price",
        lookup_expr="lte"
    )

    is_featured = django_filters.BooleanFilter()

    tags = django_filters.CharFilter(field_name="tags__slug")

    # =========================
    # VARIANT FILTERS (FIXED)
    # =========================

    size = django_filters.CharFilter(method="filter_size")
    color = django_filters.CharFilter(method="filter_color")

    # =========================
    # SALE FILTER (OPTIMIZED)
    # =========================

    is_on_sale = django_filters.BooleanFilter(method="filter_on_sale")

    # =========================
    # ORDERING
    # =========================

    ordering = django_filters.OrderingFilter(
        fields=(
            ("base_price", "price_asc"),
            ("-base_price", "price_desc"),
            ("created_at", "newest"),
            ("-created_at", "oldest"),
        )
    )

    class Meta:
        model = Product
        fields = []

    # =========================
    # SIZE FILTER
    # =========================

    def filter_size(self, queryset, name, value):
        return queryset.filter(
            variants__size__iexact=value
        ).distinct()

    # =========================
    # COLOR FILTER
    # =========================

    def filter_color(self, queryset, name, value):
        return queryset.filter(
            variants__color__iexact=value
        ).distinct()

    # =========================
    # SALE FILTER
    # =========================

    def filter_on_sale(self, queryset, name, value):
        if value:
            return queryset.filter(
                sale_price__isnull=False,
                sale_price__lt=F("base_price")
            )
        return queryset

    # =========================
    # CUSTOM ORDERING LOGIC
    # =========================

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)

        if self.data.get("ordering") == "most_popular":
            queryset = queryset.annotate(
                review_count=Count("reviews", distinct=True)
            ).order_by("-review_count")

        return queryset