from django.urls import path
from apps.orders.views import (
    UserOrderListView,
    OrderDetailView,
    CancelOrderView,
    GuestOrderTrackView,
)

urlpatterns = [
    path("",               UserOrderListView.as_view(),  name="order-list"),
    path("track/",         GuestOrderTrackView.as_view(), name="order-track"),
    path("<uuid:order_id>/",        OrderDetailView.as_view(),   name="order-detail"),
    path("<uuid:order_id>/cancel/", CancelOrderView.as_view(),   name="order-cancel"),
]