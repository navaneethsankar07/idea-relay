import pytest
import responses
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import OAuthAccount, User


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
class TestOAuthAuthentication:

    def test_github_auth_url_endpoint(self, client):
        url = reverse('auth-oauth-github-url')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'url' in data
        assert 'https://github.com/login/oauth/authorize' in data['url']
        assert 'state' in data

    def test_google_auth_url_endpoint(self, client):
        url = reverse('auth-oauth-google-url')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'url' in data
        assert 'https://accounts.google.com/o/oauth2/v2/auth' in data['url']
        assert 'state' in data

    @responses.activate
    def test_successful_github_authentication_new_user(self, client):
        # Mock GitHub token exchange
        responses.add(
            responses.POST,
            'https://github.com/login/oauth/access_token',
            json={'access_token': 'mock_gh_access_token', 'token_type': 'bearer'},
            status=200,
        )

        # Mock GitHub user profile
        responses.add(
            responses.GET,
            'https://api.github.com/user',
            json={
                'id': 123456,
                'name': 'Octo Cat',
                'login': 'octocat',
                'avatar_url': 'https://avatars.githubusercontent.com/u/123456',
            },
            status=200,
        )

        # Mock GitHub emails
        responses.add(
            responses.GET,
            'https://api.github.com/user/emails',
            json=[
                {'email': 'octocat@github.com', 'primary': True, 'verified': True},
            ],
            status=200,
        )

        callback_url = reverse('auth-oauth-github-callback')
        response = client.post(callback_url, {'code': 'valid_gh_code'})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['email'] == 'octocat@github.com'
        assert data['user']['first_name'] == 'Octo'
        assert data['user']['last_name'] == 'Cat'
        assert 'tokens' in data
        assert 'access' in data['tokens']

        # Verify DB records
        user = User.objects.get(email='octocat@github.com')
        assert user.is_email_verified is True
        assert OAuthAccount.objects.filter(
            user=user,
            provider='github',
            provider_user_id='123456',
        ).exists()

    @responses.activate
    def test_successful_google_authentication_new_user(self, client):
        # Mock Google token exchange
        responses.add(
            responses.POST,
            'https://oauth2.googleapis.com/token',
            json={'access_token': 'mock_google_token'},
            status=200,
        )

        # Mock Google user info
        responses.add(
            responses.GET,
            'https://www.googleapis.com/oauth2/v3/userinfo',
            json={
                'sub': 'google-uid-789',
                'email': 'alex@gmail.com',
                'email_verified': True,
                'given_name': 'Alex',
                'family_name': 'Morgan',
                'picture': 'https://lh3.googleusercontent.com/photo.jpg',
            },
            status=200,
        )

        callback_url = reverse('auth-oauth-google-callback')
        response = client.post(callback_url, {'code': 'valid_google_code'})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['email'] == 'alex@gmail.com'
        assert data['user']['first_name'] == 'Alex'
        assert 'tokens' in data

        user = User.objects.get(email='alex@gmail.com')
        assert user.is_email_verified is True
        assert OAuthAccount.objects.filter(
            user=user,
            provider='google',
            provider_user_id='google-uid-789',
        ).exists()

    @responses.activate
    def test_existing_user_automatic_linking_on_verified_email(self, client):
        # Create user beforehand via email/password
        existing_user = User.objects.create_user(
            email='existing@example.com',
            password='Password123!',
            first_name='Existing',
            last_name='User',
        )

        # Google returns same email
        responses.add(
            responses.POST,
            'https://oauth2.googleapis.com/token',
            json={'access_token': 'mock_google_token'},
            status=200,
        )
        responses.add(
            responses.GET,
            'https://www.googleapis.com/oauth2/v3/userinfo',
            json={
                'sub': 'google-sub-444',
                'email': 'existing@example.com',
                'email_verified': True,
                'given_name': 'Existing',
                'family_name': 'User',
            },
            status=200,
        )

        callback_url = reverse('auth-oauth-google-callback')
        response = client.post(callback_url, {'code': 'code_444'})

        assert response.status_code == status.HTTP_200_OK
        # Ensure no duplicate user was created
        assert User.objects.filter(email='existing@example.com').count() == 1
        assert OAuthAccount.objects.filter(
            user=existing_user,
            provider='google',
            provider_user_id='google-sub-444',
        ).exists()

    @responses.activate
    def test_authenticated_user_links_provider(self, client):
        user = User.objects.create_user(
            email='myaccount@example.com',
            password='MyPassword123!',
        )
        client.force_authenticate(user=user)

        responses.add(
            responses.POST,
            'https://github.com/login/oauth/access_token',
            json={'access_token': 'mock_gh_token'},
            status=200,
        )
        responses.add(
            responses.GET,
            'https://api.github.com/user',
            json={'id': 99999, 'name': 'Dev User', 'login': 'devuser'},
            status=200,
        )
        responses.add(
            responses.GET,
            'https://api.github.com/user/emails',
            json=[{'email': 'myaccount@example.com', 'primary': True, 'verified': True}],
            status=200,
        )

        res = client.post(reverse('auth-oauth-github-callback'), {'code': 'link_code'})
        assert res.status_code == status.HTTP_200_OK

        assert OAuthAccount.objects.filter(
            user=user,
            provider='github',
            provider_user_id='99999',
        ).exists()

    @responses.activate
    def test_duplicate_provider_identity_prevention(self, client):
        user1 = User.objects.create_user(email='user1@example.com', password='Password123!')
        OAuthAccount.objects.create(
            user=user1,
            provider='github',
            provider_user_id='same_github_id',
            provider_email='user1@example.com',
        )

        # User2 tries to link the same GitHub account
        user2 = User.objects.create_user(email='user2@example.com', password='Password123!')
        client.force_authenticate(user=user2)

        responses.add(
            responses.POST,
            'https://github.com/login/oauth/access_token',
            json={'access_token': 'mock_gh_token'},
            status=200,
        )
        responses.add(
            responses.GET,
            'https://api.github.com/user',
            json={'id': 'same_github_id', 'login': 'gh_user'},
            status=200,
        )
        responses.add(
            responses.GET,
            'https://api.github.com/user/emails',
            json=[{'email': 'user1@example.com', 'primary': True, 'verified': True}],
            status=200,
        )

        res = client.post(reverse('auth-oauth-github-callback'), {'code': 'test_code'})
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already linked to a different IdeaRelay user' in str(res.json())

    @responses.activate
    def test_oauth_error_handling(self, client):
        responses.add(
            responses.POST,
            'https://github.com/login/oauth/access_token',
            json={'error': 'bad_verification_code', 'error_description': 'The code passed is incorrect or expired.'},
            status=200,
        )
        res = client.post(reverse('auth-oauth-github-callback'), {'code': 'invalid_code'})
        assert res.status_code == status.HTTP_400_BAD_REQUEST
