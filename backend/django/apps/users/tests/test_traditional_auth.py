import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User
from apps.users.tokens import email_verification_token_generator, encode_user_id, password_reset_token_generator


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def registered_user():
    return User.objects.create_user(
        email='testuser@example.com',
        password='ValidPassword123!',
        first_name='Test',
        last_name='User',
        is_email_verified=False,
    )


@pytest.mark.django_db
class TestTraditionalAuthentication:

    def test_successful_registration(self, client):
        url = reverse('auth-register')
        payload = {
            'email': 'newuser@example.com',
            'first_name': 'Jane',
            'last_name': 'Doe',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
        }
        response = client.post(url, payload)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['user']['email'] == 'newuser@example.com'
        assert data['user']['first_name'] == 'Jane'
        assert 'tokens' in data
        assert 'access' in data['tokens']
        assert 'refresh' in data['tokens']

        # Verify user in database
        user = User.objects.get(email='newuser@example.com')
        assert user.check_password('StrongPassword123!')
        assert not user.is_email_verified

    def test_duplicate_email_registration(self, client, registered_user):
        url = reverse('auth-register')
        payload = {
            'email': registered_user.email,
            'password': 'AnotherPassword123!',
            'password_confirm': 'AnotherPassword123!',
        }
        response = client.post(url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.json()

    def test_invalid_email_registration(self, client):
        url = reverse('auth-register')
        payload = {
            'email': 'not-an-email',
            'password': 'ValidPassword123!',
            'password_confirm': 'ValidPassword123!',
        }
        response = client.post(url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_weak_password_registration(self, client):
        url = reverse('auth-register')
        payload = {
            'email': 'weakpass@example.com',
            'password': '123',
            'password_confirm': '123',
        }
        response = client.post(url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_password_mismatch_registration(self, client):
        url = reverse('auth-register')
        payload = {
            'email': 'mismatch@example.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'DifferentPassword123!',
        }
        response = client.post(url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password_confirm' in response.json()

    def test_successful_login(self, client, registered_user):
        url = reverse('auth-login')
        payload = {
            'email': 'testuser@example.com',
            'password': 'ValidPassword123!',
        }
        response = client.post(url, payload)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['user']['email'] == 'testuser@example.com'
        assert 'access' in data['tokens']
        assert 'refresh' in data['tokens']
        assert 'refresh_token' in response.cookies

    def test_incorrect_password_login(self, client, registered_user):
        url = reverse('auth-login')
        payload = {
            'email': 'testuser@example.com',
            'password': 'WrongPassword123!',
        }
        response = client.post(url, payload)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_jwt_token_refresh(self, client, registered_user):
        login_url = reverse('auth-login')
        login_res = client.post(login_url, {
            'email': 'testuser@example.com',
            'password': 'ValidPassword123!',
        })
        refresh_token = login_res.json()['tokens']['refresh']

        refresh_url = reverse('auth-token-refresh')
        response = client.post(refresh_url, {'refresh': refresh_token})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'access' in data
        assert 'refresh' in data

    def test_logout_and_token_invalidation(self, client, registered_user):
        login_res = client.post(reverse('auth-login'), {
            'email': 'testuser@example.com',
            'password': 'ValidPassword123!',
        })
        refresh_token = login_res.json()['tokens']['refresh']

        # Logout
        logout_url = reverse('auth-logout')
        logout_res = client.post(logout_url, {'refresh': refresh_token})
        assert logout_res.status_code == status.HTTP_200_OK

        # Attempt to use the same refresh token should now fail
        refresh_url = reverse('auth-token-refresh')
        failed_refresh = client.post(refresh_url, {'refresh': refresh_token})
        assert failed_refresh.status_code == status.HTTP_401_UNAUTHORIZED

    def test_email_verification(self, client, registered_user):
        uid = encode_user_id(registered_user)
        token = email_verification_token_generator.make_token(registered_user)

        verify_url = reverse('auth-email-verify')
        response = client.post(verify_url, {'uid': uid, 'token': token})

        assert response.status_code == status.HTTP_200_OK
        registered_user.refresh_from_db()
        assert registered_user.is_email_verified is True

    def test_email_verification_invalid_token(self, client, registered_user):
        uid = encode_user_id(registered_user)
        verify_url = reverse('auth-email-verify')
        response = client.post(verify_url, {'uid': uid, 'token': 'invalid-token-123'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_password_reset_flow(self, client, registered_user):
        # 1. Request reset
        forgot_url = reverse('auth-password-forgot')
        forgot_res = client.post(forgot_url, {'email': registered_user.email})
        assert forgot_res.status_code == status.HTTP_200_OK

        # 2. Reset with generated token
        uid = encode_user_id(registered_user)
        token = password_reset_token_generator.make_token(registered_user)

        reset_url = reverse('auth-password-reset')
        reset_res = client.post(reset_url, {
            'uid': uid,
            'token': token,
            'new_password': 'BrandNewPassword123!',
            'new_password_confirm': 'BrandNewPassword123!',
        })
        assert reset_res.status_code == status.HTTP_200_OK

        # 3. Verify user can log in with new password
        login_res = client.post(reverse('auth-login'), {
            'email': registered_user.email,
            'password': 'BrandNewPassword123!',
        })
        assert login_res.status_code == status.HTTP_200_OK

    def test_change_password_authenticated(self, client, registered_user):
        # Authenticate client
        client.force_authenticate(user=registered_user)

        change_url = reverse('auth-password-change')
        res = client.post(change_url, {
            'old_password': 'ValidPassword123!',
            'new_password': 'UpdatedPassword456!',
            'new_password_confirm': 'UpdatedPassword456!',
        })
        assert res.status_code == status.HTTP_200_OK

        registered_user.refresh_from_db()
        assert registered_user.check_password('UpdatedPassword456!')
