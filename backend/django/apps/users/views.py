import logging
import secrets

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import OAuthAccount
from apps.users.serializers import (
    EmailResendSerializer,
    EmailVerificationSerializer,
    ForgotPasswordSerializer,
    LogoutSerializer,
    OAuthAccountSerializer,
    OAuthCallbackSerializer,
    PasswordChangeSerializer,
    PasswordResetSerializer,
    TokenRefreshRequestSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
)
from apps.users.services.auth_service import AuthService
from apps.users.services.oauth_service import OAuthService

logger = logging.getLogger(__name__)


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Sets secure HttpOnly refresh token cookie."""
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        samesite='Lax',
        secure=not settings.DEBUG,
        path='/api/v1/auth/',
        max_age=3600 * 24 * 7,  # 7 days
    )


class RegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user, tokens = AuthService.register_user(serializer.validated_data)
        except DjangoValidationError as exc:
            return Response(exc.message_dict if hasattr(exc, 'message_dict') else {'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response = Response(
            {
                'user': UserProfileSerializer(user).data,
                'tokens': tokens,
                'message': 'Registration successful. A verification email has been dispatched.',
            },
            status=status.HTTP_201_CREATED,
        )
        set_refresh_cookie(response, tokens['refresh'])
        return response


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user, tokens = AuthService.authenticate_user(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
            )
        except DjangoValidationError as exc:
            return Response(
                exc.message_dict if hasattr(exc, 'message_dict') else {'detail': exc.message if hasattr(exc, 'message') else str(exc)},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response(
            {
                'user': UserProfileSerializer(user).data,
                'tokens': tokens,
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, tokens['refresh'])
        return response


class LogoutView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        refresh_token = request.data.get('refresh') or request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({'detail': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LogoutSerializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)

        try:
            AuthService.logout_user(refresh_token)
        except DjangoValidationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response = Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token', path='/api/v1/auth/')
        return response


class TokenRefreshView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        refresh_token = request.data.get('refresh') or request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({'detail': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TokenRefreshRequestSerializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)

        try:
            refresh = RefreshToken(refresh_token)
            data = {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        except TokenError as exc:
            return Response({'detail': f'Token is invalid or expired: {exc}'}, status=status.HTTP_401_UNAUTHORIZED)

        response = Response(data, status=status.HTTP_200_OK)
        set_refresh_cookie(response, data['refresh'])
        return response


class EmailVerifyView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = AuthService.verify_email(
                uidb64=serializer.validated_data['uid'],
                token=serializer.validated_data['token'],
            )
        except DjangoValidationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Email address verified successfully.',
                'user': UserProfileSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class EmailResendView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = EmailResendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthService.resend_verification_email(serializer.validated_data['email'])
        return Response(
            {'message': 'If an active unverified account exists, a verification link has been dispatched.'},
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthService.request_password_reset(serializer.validated_data['email'])
        return Response(
            {'message': 'If an account exists with this email, password reset instructions have been sent.'},
            status=status.HTTP_200_OK,
        )


class PasswordResetView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            AuthService.reset_password(
                uidb64=serializer.validated_data['uid'],
                token=serializer.validated_data['token'],
                new_password=serializer.validated_data['new_password'],
            )
        except DjangoValidationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {'message': 'Password has been successfully reset. You may now log in with your new password.'},
            status=status.HTTP_200_OK,
        )


class PasswordChangeView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request: Request) -> Response:
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            AuthService.change_password(
                user=request.user,
                old_password=serializer.validated_data.get('old_password', ''),
                new_password=serializer.validated_data['new_password'],
            )
        except DjangoValidationError as exc:
            return Response(exc.message_dict if hasattr(exc, 'message_dict') else {'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class CurrentUserProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request: Request) -> Response:
        return Response(UserProfileSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request: Request) -> Response:
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserProfileSerializer(request.user).data, status=status.HTTP_200_OK)


class DeactivateAccountView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request: Request) -> Response:
        user = request.user
        user.is_active = False
        user.save(update_fields=['is_active', 'updated_at'])

        # Invalidate refresh tokens
        refresh_token = request.data.get('refresh') or request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                AuthService.logout_user(refresh_token)
            except Exception:
                pass

        response = Response({'message': 'Account deactivated successfully.'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token', path='/api/v1/auth/')
        return response


class LinkedAccountsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request: Request) -> Response:
        accounts = OAuthAccount.objects.filter(user=request.user)
        return Response(
            {
                'linked_providers': OAuthAccountSerializer(accounts, many=True).data,
                'has_usable_password': request.user.has_usable_password(),
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request: Request, provider: str) -> Response:
        try:
            OAuthService.unlink_provider(request.user, provider.lower())
        except DjangoValidationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {'message': f'{provider.capitalize()} account disconnected successfully.'},
            status=status.HTTP_200_OK,
        )


# --- OAuth Views ---


class GitHubAuthURLView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request: Request) -> Response:
        redirect_uri = request.query_params.get(
            'redirect_uri',
            f"{settings.FRONTEND_URL}/auth/callback/github",
        )
        state = request.query_params.get('state') or secrets.token_urlsafe(16)
        auth_url = OAuthService.get_github_auth_url(redirect_uri=redirect_uri, state=state)
        return Response({'url': auth_url, 'state': state}, status=status.HTTP_200_OK)


class GitHubCallbackView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = OAuthCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        redirect_uri = serializer.validated_data.get('redirect_uri') or f"{settings.FRONTEND_URL}/auth/callback/github"

        try:
            oauth_data = OAuthService.exchange_github_code(
                code=serializer.validated_data['code'],
                redirect_uri=redirect_uri,
            )
            current_user = request.user if request.user.is_authenticated else None
            user, tokens = OAuthService.authenticate_or_link_oauth_user(
                oauth_data=oauth_data,
                current_authenticated_user=current_user,
            )
        except DjangoValidationError as exc:
            return Response(
                exc.message_dict if hasattr(exc, 'message_dict') else {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = Response(
            {
                'user': UserProfileSerializer(user).data,
                'tokens': tokens,
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, tokens['refresh'])
        return response


class GoogleAuthURLView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request: Request) -> Response:
        redirect_uri = request.query_params.get(
            'redirect_uri',
            f"{settings.FRONTEND_URL}/auth/callback/google",
        )
        state = request.query_params.get('state') or secrets.token_urlsafe(16)
        auth_url = OAuthService.get_google_auth_url(redirect_uri=redirect_uri, state=state)
        return Response({'url': auth_url, 'state': state}, status=status.HTTP_200_OK)


class GoogleCallbackView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = OAuthCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        redirect_uri = serializer.validated_data.get('redirect_uri') or f"{settings.FRONTEND_URL}/auth/callback/google"

        try:
            oauth_data = OAuthService.exchange_google_code(
                code=serializer.validated_data['code'],
                redirect_uri=redirect_uri,
            )
            current_user = request.user if request.user.is_authenticated else None
            user, tokens = OAuthService.authenticate_or_link_oauth_user(
                oauth_data=oauth_data,
                current_authenticated_user=current_user,
            )
        except DjangoValidationError as exc:
            return Response(
                exc.message_dict if hasattr(exc, 'message_dict') else {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = Response(
            {
                'user': UserProfileSerializer(user).data,
                'tokens': tokens,
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, tokens['refresh'])
        return response
