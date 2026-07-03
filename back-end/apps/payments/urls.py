"""
apps/payments/urls.py
"""

from django.urls import path
from apps.payments.views import (
    CreatePaymentIntentView,
    MockPaymentStatusView,
    SendOTPView,
    VerifyOTPAndCreateOrderView,
)

urlpatterns = [
    # Legacy payment endpoints
    path("create-intent/", CreatePaymentIntentView.as_view(), name="create-payment-intent"),
    path("mock-status/<str:intent_id>/", MockPaymentStatusView.as_view(), name="mock-payment-status"),

    # OTP verification endpoints
    path("send-otp/", SendOTPView.as_view(), name="send-otp"),
    path("verify-and-create-order/", VerifyOTPAndCreateOrderView.as_view(), name="verify-and-create-order"),
]