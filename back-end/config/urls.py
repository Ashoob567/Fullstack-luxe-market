"""
URL configuration for Luxe Market project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from django.http import HttpResponse

def prometheus_metrics(request):
    """Expose Prometheus metrics at /metrics"""
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('_nested_admin/', include('nested_admin.urls')),  # For nested inline JS
    path('api/auth/', include('apps.users.urls')),
    path('api/products/', include('apps.products.urls')),#pass
    path('api/orders/', include('apps.orders.urls')),#pending 401
    path('api/payments/', include('apps.payments.urls')),#pending page not found
    path('api/cart/', include('apps.cart.urls')),#pending page not found
    path('api/categories/',include('apps.products.category_urls')),#pass
    path("api/wishlist/", include("apps.wishlists.urls")),#pending
    path("api/coupons/", include("apps.coupons.urls")),#pending

    # Prometheus metrics endpoint
    path('metrics/', prometheus_metrics, name='prometheus-metrics'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
