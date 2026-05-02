"""
DocPilot AI — Tenancy Serializers
"""

from rest_framework import serializers

from apps.identity_access.api.serializers import UserProfileSerializer
from apps.tenancy.models import (
    KnowledgeSpace,
    SpaceAccessProfile,
    Tenant,
    TenantMembership,
    UserInvitation,
    UserSpaceAccess,
    UserSpaceProfile,
)


class TenantSerializer(serializers.ModelSerializer):
    """Tenant details (read-only for list/detail)."""

    class Meta:
        model = Tenant
        fields = ["id", "name", "slug", "status", "created_at"]
        read_only_fields = fields


class TenantMembershipSerializer(serializers.ModelSerializer):
    """Membership with tenant info (used in "my tenants" list)."""

    tenant = TenantSerializer(read_only=True)

    class Meta:
        model = TenantMembership
        fields = ["id", "tenant", "role", "status", "created_at"]
        read_only_fields = fields


class TenantMemberSerializer(serializers.ModelSerializer):
    """Member details within a tenant (used in members list)."""

    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = TenantMembership
        fields = ["id", "user", "role", "status", "created_at"]
        read_only_fields = fields


class TenantCreateSerializer(serializers.ModelSerializer):
    """Create new tenant."""

    class Meta:
        model = Tenant
        fields = ["name", "slug"]

    def validate_slug(self, value):
        if Tenant.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Ce slug est déjà utilisé.")
        return value.lower().strip()


class InviteMemberSerializer(serializers.Serializer):
    """Invite a user to a tenant by email."""

    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=["admin", "manager", "member"],
        default="member",
    )


class UpdateMemberRoleSerializer(serializers.Serializer):
    """Update a member's role."""

    role = serializers.ChoiceField(choices=["admin", "manager", "member"])


class KnowledgeSpaceSerializer(serializers.ModelSerializer):
    """Knowledge space within a tenant."""

    document_count = serializers.SerializerMethodField()

    class Meta:
        model = KnowledgeSpace
        fields = ["id", "name", "slug", "description", "is_active", "document_count", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_document_count(self, obj):
        """Return the number of documents in this space."""
        return obj.documents.count()


class KnowledgeSpaceCreateSerializer(serializers.ModelSerializer):
    """Create new knowledge space."""

    class Meta:
        model = KnowledgeSpace
        fields = ["name", "slug", "description"]

    def validate_slug(self, value):
        return value.lower().strip()


class TenantPermissionsSerializer(serializers.Serializer):
    """User's permissions within a tenant."""

    role = serializers.CharField()
    can_upload = serializers.BooleanField()
    can_delete_documents = serializers.BooleanField()
    can_manage_members = serializers.BooleanField()
    can_view_admin = serializers.BooleanField()
    accessible_space_ids = serializers.ListField(child=serializers.UUIDField())


class SpaceAccessProfileSerializer(serializers.ModelSerializer):
    """Space access profile with its spaces."""

    spaces = KnowledgeSpaceSerializer(many=True, read_only=True)
    space_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False, default=list
    )

    class Meta:
        model = SpaceAccessProfile
        fields = ["id", "name", "description", "spaces", "space_ids", "created_at"]
        read_only_fields = ["id", "created_at", "spaces"]


class SpaceAccessProfileCreateSerializer(serializers.Serializer):
    """Create or update a space access profile."""

    name = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, default="")
    space_ids = serializers.ListField(child=serializers.UUIDField(), default=list)


class UserSpaceAccessSerializer(serializers.ModelSerializer):
    """Direct user → space grant."""

    space = KnowledgeSpaceSerializer(read_only=True)
    granted_by = UserProfileSerializer(read_only=True)

    class Meta:
        model = UserSpaceAccess
        fields = ["id", "space", "granted_by", "created_at"]
        read_only_fields = fields


class UserSpaceProfileSerializer(serializers.ModelSerializer):
    """Profile assignment for a user."""

    profile = SpaceAccessProfileSerializer(read_only=True)
    granted_by = UserProfileSerializer(read_only=True)

    class Meta:
        model = UserSpaceProfile
        fields = ["id", "profile", "granted_by", "created_at"]
        read_only_fields = fields


class UserInvitationSerializer(serializers.ModelSerializer):
    """Invitation details (read-only, for list/detail)."""

    invited_by = UserProfileSerializer(read_only=True)
    is_pending = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserInvitation
        fields = [
            "id", "email", "role", "token", "invited_by",
            "expires_at", "consumed_at", "revoked_at", "is_pending", "created_at",
        ]
        read_only_fields = fields


class InvitationAcceptSerializer(serializers.Serializer):
    """Payload for accepting an invitation — creates a new user account."""

    full_name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=10)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        return attrs
