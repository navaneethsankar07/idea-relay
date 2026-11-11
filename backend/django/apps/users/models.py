import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.users.managers import CustomUserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for IdeaRelay where email is the unique identifier.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(
        verbose_name='email address',
        max_length=255,
        unique=True,
        db_index=True,
    )
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    avatar_url = models.URLField(max_length=1024, blank=True, null=True)

    is_email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ['-created_at']

    @property
    def full_name(self) -> str:
        name = f'{self.first_name} {self.last_name}'.strip()
        return name if name else self.email

    def can_disconnect_provider(self, provider: str) -> bool:
        """
        An account must always retain at least one usable authentication method:
        either a usable password, or at least one other linked OAuth provider.
        """
        if self.has_usable_password():
            return True
        remaining_count = self.oauth_accounts.exclude(provider=provider).count()
        return remaining_count > 0

    def __str__(self) -> str:
        return self.email


class OAuthAccount(models.Model):
    """
    Stores linked third-party OAuth identities (e.g. GitHub, Google).
    """

    PROVIDER_GITHUB = 'github'
    PROVIDER_GOOGLE = 'google'
    PROVIDER_CHOICES = [
        (PROVIDER_GITHUB, 'GitHub'),
        (PROVIDER_GOOGLE, 'Google'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='oauth_accounts',
    )
    provider = models.CharField(max_length=32, choices=PROVIDER_CHOICES)
    provider_user_id = models.CharField(max_length=255)
    provider_email = models.EmailField(max_length=255, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'OAuth Account'
        verbose_name_plural = 'OAuth Accounts'
        constraints = [
            models.UniqueConstraint(
                fields=['provider', 'provider_user_id'],
                name='unique_provider_user',
            ),
            models.UniqueConstraint(
                fields=['user', 'provider'],
                name='unique_user_provider_account',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.user.email} -> {self.provider} ({self.provider_user_id})'
