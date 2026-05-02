from django.urls import path

from .views import AdminUserDetailView, AdminUsersListView

urlpatterns = [
    path("users/", AdminUsersListView.as_view()),
    path("users/<uuid:user_id>/", AdminUserDetailView.as_view()),
]
