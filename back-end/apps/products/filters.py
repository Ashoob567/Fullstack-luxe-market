import django_filters
from django.db.models import F, Count, Case, When, DecimalField

from .models import Product


class ProductFilter(django_filters.FilterSet):

    # =========================
    # BASIC FILTERS
    # =========================

    category    = django_filters.CharFilter(field_name="category__slug")
    ids         = django_filters.CharFilter(method="filter_ids")
    min_price   = django_filters.NumberFilter(method="filter_min_price")
    max_price   = django_filters.NumberFilter(method="filter_max_price")
    is_featured = django_filters.BooleanFilter()
    tags        = django_filters.CharFilter(field_name="tags__slug")

    # =========================
    # VARIANT FILTERS
    # =========================

    size  = django_filters.CharFilter(method="filter_size")
    color = django_filters.CharFilter(method="filter_color")

    # =========================
    # SALE FILTER
    # =========================

    is_on_sale = django_filters.BooleanFilter(method="filter_on_sale")

    # =========================
    # ORDERING
    # =========================

    ordering = django_filters.OrderingFilter(
        fields=(
            ("effective_price", "price_asc"),   # now sorts on real price
            ("-effective_price", "price_desc"),  # not base_price
            ("created_at", "newest"),
            ("-created_at", "oldest"),
        )
    )

    class Meta:
        model = Product
        fields = []

    # =========================
    # SINGLE ANNOTATION POINT
    # Runs once before all filters.
    # Every method below can safely use effective_price.
    # =========================

    def filter_queryset(self, queryset):
        # Annotate effective_price ONCE here — all filter methods reuse it
        queryset = queryset.annotate(
            effective_price=Case(
                When(
                    sale_price__isnull=False,
                    sale_price__lt=F("base_price"),
                    then=F("sale_price"),
                ),
                default=F("base_price"),
                output_field=DecimalField(),
            )
        )

        # Let django-filters apply all declared filters normally
        queryset = super().filter_queryset(queryset)

        # Custom ordering that needs the annotation
        if self.data.get("ordering") == "most_popular":
            queryset = queryset.annotate(
                review_count=Count("reviews", distinct=True)
            ).order_by("-review_count")

        return queryset

    # =========================
    # PRICE FILTERS
    # (annotation already done — just filter)
    # =========================

    def filter_min_price(self, queryset, name, value):
        return queryset.filter(effective_price__gte=value)

    def filter_max_price(self, queryset, name, value):
        return queryset.filter(effective_price__lte=value)

    # =========================
    # IDS FILTER (for wishlist)
    # =========================

    def filter_ids(self, queryset, name, value):
        id_list = [v.strip() for v in value.split(",") if v.strip()]
        if id_list:
            return queryset.filter(id__in=id_list)
        return queryset

    # =========================
    # VARIANT FILTERS
    # =========================

    def filter_size(self, queryset, name, value):
        return queryset.filter(variants__size__iexact=value).distinct()

    def filter_color(self, queryset, name, value):
        return queryset.filter(variants__color__iexact=value).distinct()

    # =========================
    # SALE FILTER
    # =========================

    def filter_on_sale(self, queryset, name, value):
        if value:
            return queryset.filter(
                sale_price__isnull=False,
                sale_price__lt=F("base_price"),
            )
        return queryset