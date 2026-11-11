from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from apps.users.models import User


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """
    Generates a secure, time-limited token for email verification.
    Invalidates automatically when is_email_verified changes or email changes.
    """

    def _make_hash_value(self, user: User, timestamp: int) -> str:
        return f'{user.pk}{user.is_email_verified}{user.email}{timestamp}'


email_verification_token_generator = EmailVerificationTokenGenerator()
password_reset_token_generator = PasswordResetTokenGenerator()


def encode_user_id(user: User) -> str:
    """Encode user UUID to urlsafe base64 string."""
    return urlsafe_base64_encode(force_bytes(str(user.pk)))


def decode_user_id(uidb64: str) -> str | None:
    """Decode urlsafe base64 string to user UUID string."""
    try:
        return force_str(urlsafe_base64_decode(uidb64))
    except (TypeError, ValueError, OverflowError):
        return None
