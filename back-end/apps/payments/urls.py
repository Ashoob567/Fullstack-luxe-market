"""
apps/payments/urls.py
"""

from django.urls import path
from apps.payments.views import CreatePaymentIntentView, MockPaymentStatusView

urlpatterns = [
    path("create-intent/",        CreatePaymentIntentView.as_view(), name="create-payment-intent"),
    path("mock-status/<str:intent_id>/", MockPaymentStatusView.as_view(), name="mock-payment-status"),
]