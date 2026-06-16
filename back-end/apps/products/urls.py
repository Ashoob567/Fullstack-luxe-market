from django.urls import path
from .views import (
    ProductListView,
    FeaturedProductsView,
    NewArrivalsView,
    BestsellersView,
    FlashSaleView,
    # ProductImageUploadView,  # DEPRECATED - Kept for backward compatibility (returns 410 Gone)
    # ProductDetailView,  # DEPRECATED
    ReviewListView,
    ReviewCreateView,
)

app_name = "products"

urlpatterns = [
    # Product list + special filters
    path("", ProductListView.as_view(), name="product-list"),
    path("featured/", FeaturedProductsView.as_view(), name="featured-products"),
    path("new-arrivals/", NewArrivalsView.as_view(), name="new-arrivals"),
    path("bestsellers/", BestsellersView.as_view(), name="bestsellers"),
    path("flash-sale/", FlashSaleView.as_view(), name="flash-sale"),

    # DEPRECATED: Image upload endpoint (returns 410 Gone)
    # Images now uploaded via Django Admin on ProductColorVariant
    # path("<uuid:pk>/images/", ProductImageUploadView.as_view(), name="product-image-upload"),

    # DEPRECATED: Product detail — catch-all slug LAST so it doesn't shadow the above
    # path("<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),

    # Review endpoints
    path("reviews/", ReviewListView.as_view(), name="review-list"),
    path("reviews/create/", ReviewCreateView.as_view(), name="review-create"),
]