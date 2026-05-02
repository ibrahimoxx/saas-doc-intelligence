"""
DocPilot AI — Public Invitation URLs (no authentication required)
"""

from django.urls import path

from apps.tenancy.api.views import InvitationAcceptView, InvitationPublicView

urlpatterns = [
    path("<str:token>/", InvitationPublicView.as_view(), name="invitation-public"),
    path("<str:token>/accept/", InvitationAcceptView.as_view(), name="invitation-accept"),
]
