"""
DocPilot AI — Tenancy Serializers
"""

from rest_framework import serializers

from apps.identity_access.api.serializers import UserProfileSerializer
from apps.tenancy.models import KnowledgeSpace, Tenant, TenantMembership


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

    class Meta:
        model = KnowledgeSpace
        fields = ["id", "name", "slug", "description", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


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
