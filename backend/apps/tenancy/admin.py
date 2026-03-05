from django.contrib import admin

from apps.tenancy.models import KnowledgeSpace, Tenant, TenantMembership


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "slug")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(TenantMembership)
class TenantMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "tenant", "role", "status", "created_at")
    list_filter = ("role", "status")
    search_fields = ("user__email", "tenant__name")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(KnowledgeSpace)
class KnowledgeSpaceAdmin(admin.ModelAdmin):
    list_display = ("name", "tenant", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "tenant__name")
    readonly_fields = ("id", "created_at", "updated_at")
