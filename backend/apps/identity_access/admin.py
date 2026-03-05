from django.contrib import admin

from apps.identity_access.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "is_active", "is_staff", "created_at")
    list_filter = ("is_active", "is_staff")
    search_fields = ("email", "full_name")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "updated_at")
