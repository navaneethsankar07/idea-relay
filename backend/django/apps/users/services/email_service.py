import logging

from django.conf import settings
from django.core.mail import send_mail

from apps.users.models import User
from apps.users.tokens import (
    email_verification_token_generator,
    encode_user_id,
    password_reset_token_generator,
)

logger = logging.getLogger(__name__)


class EmailService:
    """
    Centralized email dispatch service for transactional notifications.
    """

    @classmethod
    def send_verification_email(cls, user: User) -> bool:
        """
        Sends an email verification link to the user.
        """
        uid = encode_user_id(user)
        token = email_verification_token_generator.make_token(user)
        verification_link = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"

        subject = "Verify your email address - IdeaRelay"
        message = (
            f"Hi {user.first_name or 'there'},\n\n"
            f"Thank you for registering with IdeaRelay.\n"
            f"Please verify your email address by clicking the link below:\n\n"
            f"{verification_link}\n\n"
            f"If you did not create an account, please disregard this email.\n\n"
            f"— The IdeaRelay Team"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return True
        except Exception as exc:
            logger.error("Failed to send verification email to %s: %s", user.email, exc)
            return False

    @classmethod
    def send_password_reset_email(cls, user: User) -> bool:
        """
        Sends a secure password reset link to the user.
        """
        uid = encode_user_id(user)
        token = password_reset_token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        subject = "Reset your password - IdeaRelay"
        message = (
            f"Hi {user.first_name or 'there'},\n\n"
            f"We received a request to reset your IdeaRelay password.\n"
            f"You can reset your password by clicking the link below:\n\n"
            f"{reset_link}\n\n"
            f"This link will expire in 24 hours. If you did not request a password reset, "
            f"you can safely ignore this email.\n\n"
            f"— The IdeaRelay Team"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return True
        except Exception as exc:
            logger.error("Failed to send password reset email to %s: %s", user.email, exc)
            return False
