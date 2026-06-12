from django.urls import path
from .views import (
   
    ProductListView,
    ProductDetailView,
    FeaturedProductsView,
    NewArrivalsView,
    BestsellersView,
    FlashSaleView,
    ProductImageUploadView,
    ReviewListView,
    ReviewCreateView,
)

app_name = "products"

urlpatterns = [
   

    # Product list + special filters
    #tests passed 
    path("", ProductListView.as_view(), name="product-list"),
    path("featured/", FeaturedProductsView.as_view(), name="featured-products"),
    path("new-arrivals/", NewArrivalsView.as_view(), name="new-arrivals"),
    path("bestsellers/", BestsellersView.as_view(), name="bestsellers"),
    path("flash-sale/", FlashSaleView.as_view(), name="flash-sale"),

    #testing pending
    # Image upload (UUID-based — must come before <slug:slug>/)
    path("<uuid:pk>/images/", ProductImageUploadView.as_view(), name="product-image-upload"),

    # Product detail — catch-all slug LAST so it doesn't shadow the above
    path("<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),

    # Review endpoints
     

    path("reviews/", ReviewListView.as_view(), name="review-list"),
    path("reviews/create/", ReviewCreateView.as_view(), name="review-create"),
]