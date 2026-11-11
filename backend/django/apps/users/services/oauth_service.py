import logging
import urllib.parse
from typing import Any

import requests
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.users.models import OAuthAccount, User
from apps.users.services.auth_service import AuthService

logger = logging.getLogger(__name__)


class OAuthService:
    """
    Service responsible for third-party OAuth flows (GitHub and Google),
    including authorization URL generation, code exchange, profile retrieval,
    and user account linking.
    """

    # --- Authorization URLs ---

    @classmethod
    def get_github_auth_url(cls, redirect_uri: str, state: str) -> str:
        """
        Builds the GitHub OAuth authorization URL.
        """
        base_url = "https://github.com/login/oauth/authorize"
        params = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "scope": "read:user user:email",
            "state": state,
        }
        return f"{base_url}?{urllib.parse.urlencode(params)}"

    @classmethod
    def get_google_auth_url(cls, redirect_uri: str, state: str) -> str:
        """
        Builds the Google OAuth 2.0 authorization URL.
        """
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "select_account",
            "state": state,
        }
        return f"{base_url}?{urllib.parse.urlencode(params)}"

    # --- Code Exchanges & Profile Retrieval ---

    @classmethod
    def exchange_github_code(cls, code: str, redirect_uri: str | None = None) -> dict[str, Any]:
        """
        Exchanges GitHub authorization code for user profile information.
        """
        token_url = "https://github.com/login/oauth/access_token"
        token_payload = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
        }
        if redirect_uri:
            token_payload["redirect_uri"] = redirect_uri

        headers = {"Accept": "application/json"}
        response = requests.post(token_url, json=token_payload, headers=headers, timeout=10)

        if response.status_code != 200:
            raise ValidationError({"detail": "Failed to exchange GitHub authorization code."})

        data = response.json()
        if "error" in data:
            raise ValidationError({"detail": f"GitHub OAuth error: {data.get('error_description', data['error'])}"})

        access_token = data.get("access_token")
        if not access_token:
            raise ValidationError({"detail": "No access token received from GitHub."})

        auth_headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}

        # Fetch profile
        user_res = requests.get("https://api.github.com/user", headers=auth_headers, timeout=10)
        if user_res.status_code != 200:
            raise ValidationError({"detail": "Failed to fetch user profile from GitHub."})
        user_profile = user_res.json()

        # Fetch emails to locate primary verified email
        emails_res = requests.get("https://api.github.com/user/emails", headers=auth_headers, timeout=10)
        emails = emails_res.json() if emails_res.status_code == 200 else []

        verified_email = None
        for item in emails:
            if item.get("primary") and item.get("verified"):
                verified_email = item.get("email")
                break
        if not verified_email:
            for item in emails:
                if item.get("verified"):
                    verified_email = item.get("email")
                    break

        if not verified_email:
            verified_email = user_profile.get("email")

        if not verified_email:
            raise ValidationError({"detail": "GitHub account does not have a verified public email address."})

        name = user_profile.get("name") or user_profile.get("login", "")
        parts = name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

        return {
            "provider": OAuthAccount.PROVIDER_GITHUB,
            "provider_user_id": str(user_profile["id"]),
            "email": verified_email.lower().strip(),
            "first_name": first_name,
            "last_name": last_name,
            "avatar_url": user_profile.get("avatar_url"),
        }

    @classmethod
    def exchange_google_code(cls, code: str, redirect_uri: str) -> dict[str, Any]:
        """
        Exchanges Google authorization code for verified user profile information.
        """
        token_url = "https://oauth2.googleapis.com/token"
        token_payload = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }

        response = requests.post(token_url, data=token_payload, timeout=10)
        if response.status_code != 200:
            raise ValidationError({"detail": "Failed to exchange Google authorization code."})

        data = response.json()
        access_token = data.get("access_token")
        if not access_token:
            raise ValidationError({"detail": "No access token received from Google."})

        # Fetch user info
        user_res = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if user_res.status_code != 200:
            raise ValidationError({"detail": "Failed to fetch user information from Google."})

        profile = user_res.json()
        if not profile.get("email_verified"):
            raise ValidationError({"detail": "Google email address is not verified."})

        return {
            "provider": OAuthAccount.PROVIDER_GOOGLE,
            "provider_user_id": profile["sub"],
            "email": profile["email"].lower().strip(),
            "first_name": profile.get("given_name", ""),
            "last_name": profile.get("family_name", ""),
            "avatar_url": profile.get("picture"),
        }

    # --- Identity Resolution & Account Linking ---

    @classmethod
    @transaction.atomic
    def authenticate_or_link_oauth_user(
        cls,
        oauth_data: dict[str, Any],
        current_authenticated_user: User | None = None,
    ) -> tuple[User, dict[str, str]]:
        """
        Processes OAuth callback payload:
        1. If user is currently authenticated -> links OAuth provider to their account.
        2. If OAuthAccount already exists -> authenticates linked user.
        3. If matching user email exists (verified provider email) -> links and authenticates.
        4. If new user -> creates user with is_email_verified=True and links OAuthAccount.
        """
        provider = oauth_data["provider"]
        provider_user_id = str(oauth_data["provider_user_id"])
        email = oauth_data["email"].lower().strip()
        first_name = oauth_data.get("first_name", "")
        last_name = oauth_data.get("last_name", "")
        avatar_url = oauth_data.get("avatar_url")

        # Case 1: An existing authenticated user is linking a provider
        if current_authenticated_user:
            # Check if this provider identity is already linked to another account
            existing_oauth = OAuthAccount.objects.filter(
                provider=provider,
                provider_user_id=provider_user_id,
            ).first()

            if existing_oauth and existing_oauth.user != current_authenticated_user:
                raise ValidationError({
                    "detail": f"This {provider.capitalize()} account is already linked to a different IdeaRelay user."
                })

            if not existing_oauth:
                OAuthAccount.objects.create(
                    user=current_authenticated_user,
                    provider=provider,
                    provider_user_id=provider_user_id,
                    provider_email=email,
                )
                if not current_authenticated_user.avatar_url and avatar_url:
                    current_authenticated_user.avatar_url = avatar_url
                    current_authenticated_user.save(update_fields=["avatar_url", "updated_at"])

            tokens = AuthService.generate_tokens_for_user(current_authenticated_user)
            return current_authenticated_user, tokens

        # Case 2: Check if this provider identity is already known
        oauth_account = OAuthAccount.objects.select_related("user").filter(
            provider=provider,
            provider_user_id=provider_user_id,
        ).first()

        if oauth_account:
            user = oauth_account.user
            if not user.is_active:
                raise ValidationError({"detail": "This account has been deactivated."})

            tokens = AuthService.generate_tokens_for_user(user)
            return user, tokens

        # Case 3: Check if a user with this verified email already exists
        user = User.objects.filter(email=email).first()

        if user:
            if not user.is_active:
                raise ValidationError({"detail": "This account has been deactivated."})

            # Check if user already has this provider linked with a different ID
            if OAuthAccount.objects.filter(user=user, provider=provider).exists():
                raise ValidationError({
                    "detail": f"This account already has a different {provider.capitalize()} account connected."
                })

            # Link provider to existing verified user
            OAuthAccount.objects.create(
                user=user,
                provider=provider,
                provider_user_id=provider_user_id,
                provider_email=email,
            )
            # Mark email as verified since the OAuth provider verified it
            user.is_email_verified = True
            if not user.avatar_url and avatar_url:
                user.avatar_url = avatar_url
            user.save(update_fields=["is_email_verified", "avatar_url", "updated_at"])

            tokens = AuthService.generate_tokens_for_user(user)
            return user, tokens

        # Case 4: Brand new user
        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            avatar_url=avatar_url,
            is_email_verified=True,
            is_active=True,
        )

        OAuthAccount.objects.create(
            user=user,
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=email,
        )

        tokens = AuthService.generate_tokens_for_user(user)
        return user, tokens

    @classmethod
    @transaction.atomic
    def unlink_provider(cls, user: User, provider: str) -> None:
        """
        Unlinks an external OAuth provider from the user account,
        strictly verifying that the account retains at least one usable auth method.
        """
        if not user.can_disconnect_provider(provider):
            raise ValidationError({
                "detail": "Cannot disconnect this provider. You must set a password or link another provider first."
            })

        deleted_count, _ = OAuthAccount.objects.filter(user=user, provider=provider).delete()
        if deleted_count == 0:
            raise ValidationError({"detail": f"Provider {provider} is not linked to your account."})
