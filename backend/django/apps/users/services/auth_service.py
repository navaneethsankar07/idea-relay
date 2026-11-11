import logging
from typing import Any

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User
from apps.users.services.email_service import EmailService
from apps.users.tokens import (
    decode_user_id,
    email_verification_token_generator,
    password_reset_token_generator,
)

logger = logging.getLogger(__name__)


class AuthService:
    """
    Core business logic service for user registration, authentication,
    token lifecycle, email verification, and password management.
    """

    @classmethod
    def generate_tokens_for_user(cls, user: User) -> dict[str, str]:
        """
        Generates SimpleJWT access and refresh tokens for a user.
        """
        refresh = RefreshToken.for_user(user)
        # Add custom claims to the JWT payload
        refresh['email'] = user.email
        refresh['is_email_verified'] = user.is_email_verified

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

    @classmethod
    @transaction.atomic
    def register_user(cls, validated_data: dict[str, Any]) -> tuple[User, dict[str, str]]:
        """
        Registers a new user, sends a verification email, and generates initial JWT tokens.
        """
        email = validated_data['email'].lower().strip()
        password = validated_data['password']
        first_name = validated_data.get('first_name', '').strip()
        last_name = validated_data.get('last_name', '').strip()

        if User.objects.filter(email=email).exists():
            raise ValidationError({'email': ['A user with this email address already exists.']})

        # Validate password strength
        validate_password(password)

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_email_verified=False,
            is_active=True,
        )

        # Dispatch verification email asynchronously / via EmailService
        EmailService.send_verification_email(user)

        tokens = cls.generate_tokens_for_user(user)
        return user, tokens

    @classmethod
    def authenticate_user(cls, email: str, password: str) -> tuple[User, dict[str, str]]:
        """
        Authenticates a user with email and password and returns tokens.
        """
        email = email.lower().strip()
        user = authenticate(username=email, password=password)

        if not user:
            raise ValidationError({'detail': 'Invalid email or password.'})

        if not user.is_active:
            raise ValidationError({'detail': 'This account has been deactivated.'})

        tokens = cls.generate_tokens_for_user(user)
        return user, tokens

    @classmethod
    def logout_user(cls, refresh_token_str: str) -> bool:
        """
        Blacklists the provided refresh token to invalidate the session.
        """
        try:
            token = RefreshToken(refresh_token_str)
            token.blacklist()
            return True
        except TokenError as exc:
            logger.warning("Token blacklisting failed during logout: %s", exc)
            raise ValidationError({'detail': 'Invalid or expired refresh token.'}) from exc

    @classmethod
    def verify_email(cls, uidb64: str, token: str) -> User:
        """
        Verifies the user's email address using the time-limited verification token.
        """
        user_id = decode_user_id(uidb64)
        if not user_id:
            raise ValidationError({'detail': 'Invalid verification link.'})

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist as exc:
            raise ValidationError({'detail': 'User does not exist.'}) from exc

        if user.is_email_verified:
            return user

        if not email_verification_token_generator.check_token(user, token):
            raise ValidationError({'detail': 'Verification link is invalid or has expired.'})

        user.is_email_verified = True
        user.save(update_fields=['is_email_verified', 'updated_at'])
        return user

    @classmethod
    def resend_verification_email(cls, email: str) -> bool:
        """
        Resends email verification if user exists and is not verified.
        Always returns true to prevent account enumeration.
        """
        try:
            user = User.objects.get(email=email.lower().strip(), is_active=True)
            if not user.is_email_verified:
                EmailService.send_verification_email(user)
        except User.DoesNotExist:
            pass
        return True

    @classmethod
    def request_password_reset(cls, email: str) -> bool:
        """
        Sends password reset email if account exists.
        Returns true regardless to prevent email enumeration.
        """
        try:
            user = User.objects.get(email=email.lower().strip(), is_active=True)
            EmailService.send_password_reset_email(user)
        except User.DoesNotExist:
            pass
        return True

    @classmethod
    @transaction.atomic
    def reset_password(cls, uidb64: str, token: str, new_password: str) -> User:
        """
        Resets user password with a validated time-limited reset token.
        """
        user_id = decode_user_id(uidb64)
        if not user_id:
            raise ValidationError({'detail': 'Invalid password reset link.'})

        try:
            user = User.objects.get(pk=user_id, is_active=True)
        except User.DoesNotExist as exc:
            raise ValidationError({'detail': 'User not found.'}) from exc

        if not password_reset_token_generator.check_token(user, token):
            raise ValidationError({'detail': 'Password reset link is invalid or has expired.'})

        validate_password(new_password, user=user)
        user.set_password(new_password)
        user.save(update_fields=['password', 'updated_at'])
        return user

    @classmethod
    def change_password(cls, user: User, old_password: str, new_password: str) -> None:
        """
        Changes password for an authenticated user after validating old password.
        """
        if user.has_usable_password() and not user.check_password(old_password):
            raise ValidationError({'old_password': ['Current password is incorrect.']})

        validate_password(new_password, user=user)
        user.set_password(new_password)
        user.save(update_fields=['password', 'updated_at'])
