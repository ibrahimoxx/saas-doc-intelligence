from django.urls import path

from .views import AdminUserDetailView, AdminUsersListView, AdminTenantDetailView, AdminTenantsListView

urlpatterns = [
    path('users/', AdminUsersListView.as_view()),
    path('users/<uuid:user_id>/', AdminUserDetailView.as_view()),
    path('tenants/', AdminTenantsListView.as_view()),
    path('tenants/<uuid:tenant_id>/', AdminTenantDetailView.as_view()),
    path('tenants/<uuid:tenant_id>/memberships/', AdminTenantDetailView.as_view()),
]
