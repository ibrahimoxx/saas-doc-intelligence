from django.contrib import admin

from apps.audit_observability.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "user", "tenant", "resource_type", "resource_id", "ip_address", "created_at")
    list_filter = ("action", "resource_type", "tenant")
    search_fields = ("user__email", "resource_id", "request_id")
    readonly_fields = ("id", "created_at", "updated_at", "action", "user", "tenant",
                       "resource_type", "resource_id", "details", "ip_address",
                       "user_agent", "request_id")
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False  # Audit logs are immutable

    def has_change_permission(self, request, obj=None):
        return False  # Audit logs are immutable

    def has_delete_permission(self, request, obj=None):
        return False  # Audit logs are immutable
