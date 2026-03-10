"""
DocPilot AI — Identity & Access API Views
"""

import logging

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.audit_observability.services import log_action
from apps.core.constants import AuditAction
from apps.identity_access.api.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
)

logger = logging.getLogger("apps.identity_access")


class LoginView(APIView):
    """
    POST /api/v1/auth/login/

    Authenticate with email + password, returns JWT tokens.
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        logger.info("User logged in", extra={"user_id": str(user.id), "email": user.email})
        log_action(AuditAction.LOGIN, user=user, resource_type="user", resource_id=user.id, request=request)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    """
    POST /api/v1/auth/register/

    Create a new user account.
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        logger.info("User registered", extra={"user_id": str(user.id), "email": user.email})
        log_action(AuditAction.USER_CREATED, user=user, resource_type="user", resource_id=user.id, request=request)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/

    Blacklist the refresh token to invalidate the session.
    Body: { "refresh": "<refresh_token>" }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": {"code": "missing_token", "message": "Le refresh token est requis."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass  # Token already blacklisted or invalid — still return 200

        logger.info("User logged out", extra={"user_id": str(request.user.id)})
        log_action(AuditAction.LOGOUT, user=request.user, resource_type="user", resource_id=request.user.id, request=request)
        return Response({"message": "Déconnexion réussie."}, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET  /api/v1/auth/me/  — Get current user profile
    PATCH /api/v1/auth/me/ — Update current user profile
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        logger.info("User updated profile", extra={"user_id": str(request.user.id)})
        return Response(UserProfileSerializer(request.user).data)


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/

    Change password for authenticated user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password", "updated_at"])

        logger.info("User changed password", extra={"user_id": str(request.user.id)})
        return Response({"message": "Mot de passe modifié avec succès."}, status=status.HTTP_200_OK)


class CustomTokenRefreshView(TokenRefreshView):
    """
    POST /api/v1/auth/refresh/

    Refresh access token using refresh token.
    Inherits from SimpleJWT with rotation enabled.
    """

    pass
