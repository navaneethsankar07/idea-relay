from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.users.models import OAuthAccount, User


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for public/authenticated user profile presentation.
    """

    has_usable_password = serializers.SerializerMethodField()
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'avatar_url',
            'is_email_verified',
            'has_usable_password',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'is_email_verified', 'created_at', 'updated_at']

    def get_has_usable_password(self, obj: User) -> bool:
        return obj.has_usable_password()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating mutable user profile fields.
    """

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'avatar_url']


class UserRegistrationSerializer(serializers.Serializer):
    """
    Validates registration payload.
    """

    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value: str) -> str:
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return email

    def validate(self, attrs: dict) -> dict:
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})

        # Validate password strength against Django password validators
        validate_password(attrs['password'])
        return attrs


class UserLoginSerializer(serializers.Serializer):
    """
    Validates login credentials.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class TokenRefreshRequestSerializer(serializers.Serializer):
    """
    Validates token refresh request.
    """

    refresh = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    """
    Validates logout request.
    """

    refresh = serializers.CharField()


class EmailVerificationSerializer(serializers.Serializer):
    """
    Validates email verification parameters.
    """

    uid = serializers.CharField()
    token = serializers.CharField()


class EmailResendSerializer(serializers.Serializer):
    """
    Validates resend verification request.
    """

    email = serializers.EmailField()


class ForgotPasswordSerializer(serializers.Serializer):
    """
    Validates forgot password request.
    """

    email = serializers.EmailField()


class PasswordResetSerializer(serializers.Serializer):
    """
    Validates password reset token and new passwords.
    """

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs: dict) -> dict:
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """
    Validates password change request for authenticated users.
    """

    old_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs: dict) -> dict:
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs


class OAuthCallbackSerializer(serializers.Serializer):
    """
    Validates OAuth callback input from frontend.
    """

    code = serializers.CharField()
    state = serializers.CharField(required=False, allow_blank=True)
    redirect_uri = serializers.CharField(required=False, allow_blank=True)


class OAuthAccountSerializer(serializers.ModelSerializer):
    """
    Serializer for linked OAuth provider details.
    """

    class Meta:
        model = OAuthAccount
        fields = ['provider', 'provider_email', 'created_at']
