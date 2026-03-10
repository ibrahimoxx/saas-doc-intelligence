"""
DocPilot AI — Admin Global URLs
"""

from django.urls import path

from apps.retrieval.api.admin_views import AdminStatsView, AdminRecentQueriesView

urlpatterns = [
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("queries/recent/", AdminRecentQueriesView.as_view(), name="admin-recent-queries"),
]
