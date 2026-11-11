import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import OAuthAccount, User


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_user():
    return User.objects.create_user(
        email='member@example.com',
        password='StrongPassword123!',
        first_name='Member',
        last_name='User',
        avatar_url='https://example.com/avatar.png',
    )


@pytest.mark.django_db
class TestUserManagement:

    def test_get_current_user_profile_unauthorized(self, client):
        url = reverse('auth-me')
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user_profile_authenticated(self, client, auth_user):
        client.force_authenticate(user=auth_user)
        url = reverse('auth-me')
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['email'] == auth_user.email
        assert data['first_name'] == 'Member'
        assert data['last_name'] == 'User'
        assert data['has_usable_password'] is True

    def test_update_user_profile(self, client, auth_user):
        client.force_authenticate(user=auth_user)
        url = reverse('auth-me')
        payload = {
            'first_name': 'UpdatedFirst',
            'last_name': 'UpdatedLast',
            'avatar_url': 'https://example.com/new-avatar.png',
        }
        response = client.patch(url, payload)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['first_name'] == 'UpdatedFirst'
        assert data['last_name'] == 'UpdatedLast'
        assert data['avatar_url'] == 'https://example.com/new-avatar.png'

        auth_user.refresh_from_db()
        assert auth_user.first_name == 'UpdatedFirst'

    def test_linked_accounts_listing(self, client, auth_user):
        OAuthAccount.objects.create(
            user=auth_user,
            provider='github',
            provider_user_id='gh-1234',
            provider_email='member@example.com',
        )

        client.force_authenticate(user=auth_user)
        url = reverse('auth-linked-accounts')
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['has_usable_password'] is True
        assert len(data['linked_providers']) == 1
        assert data['linked_providers'][0]['provider'] == 'github'

    def test_unlink_provider_allowed_when_has_password(self, client, auth_user):
        OAuthAccount.objects.create(
            user=auth_user,
            provider='google',
            provider_user_id='google-999',
            provider_email='member@example.com',
        )
        client.force_authenticate(user=auth_user)

        url = reverse('auth-linked-accounts-delete', kwargs={'provider': 'google'})
        response = client.delete(url)
        assert response.status_code == status.HTTP_200_OK

        assert not OAuthAccount.objects.filter(user=auth_user, provider='google').exists()

    def test_unlink_provider_forbidden_when_only_auth_method(self, client):
        # User created purely via OAuth with unusable password
        oauth_only_user = User.objects.create_user(
            email='oauthonly@example.com',
            password=None,  # Unusable password
        )
        OAuthAccount.objects.create(
            user=oauth_only_user,
            provider='github',
            provider_user_id='gh-only',
        )
        client.force_authenticate(user=oauth_only_user)

        url = reverse('auth-linked-accounts-delete', kwargs={'provider': 'github'})
        response = client.delete(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Cannot disconnect this provider' in response.json()['detail']
        assert OAuthAccount.objects.filter(user=oauth_only_user, provider='github').exists()

    def test_account_deactivation(self, client, auth_user):
        client.force_authenticate(user=auth_user)
        url = reverse('auth-deactivate')
        response = client.post(url)

        assert response.status_code == status.HTTP_200_OK
        auth_user.refresh_from_db()
        assert auth_user.is_active is False
