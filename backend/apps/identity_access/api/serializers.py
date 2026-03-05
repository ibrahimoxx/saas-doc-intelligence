"""
DocPilot AI — Identity & Access Serializers
"""

from django.contrib.auth import authenticate
from rest_framework import serializers

from apps.identity_access.models import User


class LoginSerializer(serializers.Serializer):
    """Validate login credentials and return user."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError("Email et mot de passe requis.")

        user = authenticate(request=self.context.get("request"), email=email, password=password)

        if not user:
            raise serializers.ValidationError("Email ou mot de passe incorrect.")

        if not user.is_active:
            raise serializers.ValidationError("Ce compte est désactivé.")

        attrs["user"] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile data (read-only for /me endpoint)."""

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "is_active", "created_at", "updated_at"]
        read_only_fields = fields


class UserUpdateSerializer(serializers.ModelSerializer):
    """Update user profile (full_name only for now)."""

    class Meta:
        model = User
        fields = ["full_name"]


class RegisterSerializer(serializers.ModelSerializer):
    """Register a new user."""

    password = serializers.CharField(write_only=True, min_length=10)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "full_name", "password", "password_confirm"]

    def validate_email(self, value):
        return value.lower().strip()

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    """Change password for authenticated user."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=10)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Les mots de passe ne correspondent pas."})
        return attrs
