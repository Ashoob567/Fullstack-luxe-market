import secrets

from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from config import settings

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)

User = get_user_model()

@method_decorator(ratelimit(key='ip', rate='3/m', method='POST', block=True), name='post')
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "user": UserProfileSerializer(user).data,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            user = authenticate(email=email, password=password)
            if user:
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        "user": UserProfileSerializer(user).data,
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data, status=status.HTTP_200_OK)


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def _update(self, request, partial):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=partial
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            old_password = serializer.validated_data["old_password"]
            new_password = serializer.validated_data["new_password"]
            if not request.user.check_password(old_password):
                return Response(
                    {"error": "Invalid old password"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            request.user.set_password(new_password)
            request.user.save()
            return Response(
                {"detail": "Password updated successfully"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendVerificationEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.is_verified:
            return Response({'detail': 'Already verified.'}, status=400)
        token = secrets.token_urlsafe(32)
        cache.set(f'email_verify_{token}', request.user.id, timeout=3600)  # 1 hour
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        send_mail(
            subject='Verify your LuxeMarket email',
            message=f'Click to verify: {verify_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[request.user.email],
        )
        return Response({'detail': 'Verification email sent.'})

class VerifyEmailView(APIView):
    def post(self, request):
        token = request.data.get('token')
        user_id = cache.get(f'email_verify_{token}')
        if not user_id:
            return Response({'detail': 'Invalid or expired token.'}, status=400)
        User.objects.filter(id=user_id).update(is_verified=True)
        cache.delete(f'email_verify_{token}')
        return Response({'detail': 'Email verified successfully.'})
    

class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email', '').lower()
        user = User.objects.filter(email=email).first()
        if user:  # silently succeed even if not found (security)
            token = secrets.token_urlsafe(32)
            cache.set(f'pwd_reset_{token}', user.id, timeout=1800)  # 30 min
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
            send_mail(
                subject='Reset your LuxeMarket password',
                message=f'Reset link (expires in 30 minutes): {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
            )
        return Response({'detail': 'If that email exists, a reset link has been sent.'})


@method_decorator(ratelimit(key='ip', rate='3/m', method='POST', block=True), name='post')
class ResetPasswordView(APIView):
    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        user_id = cache.get(f'pwd_reset_{token}')
        if not user_id:
            return Response({'detail': 'Invalid or expired reset link.'}, status=400)
        user = User.objects.get(id=user_id)
        user.set_password(new_password)
        user.save()
        cache.delete(f'pwd_reset_{token}')
        return Response({'detail': 'Password reset successful.'})
