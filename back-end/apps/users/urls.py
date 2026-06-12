from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    UpdateProfileView,
    ChangePasswordView,
    SendVerificationEmailView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView
)
from .address_views import (
    AddressListCreateView,
    AddressDetailView,
    AddressSetDefaultView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("me/update/", UpdateProfileView.as_view(), name="update_profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    # Address endpoints
    path("addresses/", AddressListCreateView.as_view(), name="address_list_create"),
    path("addresses/<str:address_id>/", AddressDetailView.as_view(), name="address_detail"),
    path("addresses/<str:address_id>/set-default/", AddressSetDefaultView.as_view(), name="address_set_default"),
    path('send-verification/', SendVerificationEmailView.as_view()),
    path('verify-email/', VerifyEmailView.as_view()),
    path('forgot-password/', ForgotPasswordView.as_view()),
    path('reset-password/', ResetPasswordView.as_view()),
]
