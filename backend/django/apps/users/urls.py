from django.urls import path

from apps.users.views import (
    CurrentUserProfileView,
    DeactivateAccountView,
    EmailResendView,
    EmailVerifyView,
    ForgotPasswordView,
    GitHubAuthURLView,
    GitHubCallbackView,
    GoogleAuthURLView,
    GoogleCallbackView,
    LinkedAccountsView,
    LoginView,
    LogoutView,
    PasswordChangeView,
    PasswordResetView,
    RegisterView,
    TokenRefreshView,
)

urlpatterns = [
    # Traditional authentication
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # Email verification
    path('email/verify/', EmailVerifyView.as_view(), name='auth-email-verify'),
    path('email/resend/', EmailResendView.as_view(), name='auth-email-resend'),

    # Password management
    path('password/forgot/', ForgotPasswordView.as_view(), name='auth-password-forgot'),
    path('password/reset/', PasswordResetView.as_view(), name='auth-password-reset'),
    path('password/change/', PasswordChangeView.as_view(), name='auth-password-change'),

    # User profile & account management
    path('me/', CurrentUserProfileView.as_view(), name='auth-me'),
    path('deactivate/', DeactivateAccountView.as_view(), name='auth-deactivate'),

    # Linked OAuth accounts
    path('linked-accounts/', LinkedAccountsView.as_view(), name='auth-linked-accounts'),
    path('linked-accounts/<str:provider>/', LinkedAccountsView.as_view(), name='auth-linked-accounts-delete'),

    # OAuth flows
    path('oauth/github/', GitHubAuthURLView.as_view(), name='auth-oauth-github-url'),
    path('oauth/github/callback/', GitHubCallbackView.as_view(), name='auth-oauth-github-callback'),
    path('oauth/google/', GoogleAuthURLView.as_view(), name='auth-oauth-google-url'),
    path('oauth/google/callback/', GoogleCallbackView.as_view(), name='auth-oauth-google-callback'),
]
