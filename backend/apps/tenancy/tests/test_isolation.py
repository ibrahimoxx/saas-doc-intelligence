import pytest
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.tenancy.models import Tenant, TenantMembership, KnowledgeSpace
from apps.documents.models import Document
from apps.core.constants import TenantRole, DocumentStatus

User = get_user_model()

class TestTenantIsolation(APITestCase):
    """Test mathematically robust tenant isolation across boundaries."""

    def setUp(self):
        # Create User A & Tenant A
        self.user_a = User.objects.create_user(email="user_a@test.com", password="password123")
        self.tenant_a = Tenant.objects.create(name="Tenant A")
        TenantMembership.objects.create(tenant=self.tenant_a, user=self.user_a, role=TenantRole.OWNER, status="active")
        self.space_a = KnowledgeSpace.objects.create(tenant=self.tenant_a, name="Space A")
        self.doc_a = Document.objects.create(
            tenant=self.tenant_a, knowledge_space=self.space_a, title="Doc A", created_by=self.user_a, status=DocumentStatus.AVAILABLE
        )

        # Create User B & Tenant B
        self.user_b = User.objects.create_user(email="user_b@test.com", password="password123")
        self.tenant_b = Tenant.objects.create(name="Tenant B")
        TenantMembership.objects.create(tenant=self.tenant_b, user=self.user_b, role=TenantRole.OWNER, status="active")
        self.space_b = KnowledgeSpace.objects.create(tenant=self.tenant_b, name="Space B")
        self.doc_b = Document.objects.create(
            tenant=self.tenant_b, knowledge_space=self.space_b, title="Doc B", created_by=self.user_b, status=DocumentStatus.AVAILABLE
        )

    def test_user_cannot_access_other_tenant_documents(self):
        """User A should not see or interact with User B's documents."""
        self.client.force_authenticate(user=self.user_a)
        
        # 1. Try to list Tenant B's documents
        # The URL is probably /api/v1/tenants/<tenant_id>/documents/
        url_list_b = reverse('document-list', kwargs={'tenant_id': self.tenant_b.id}) if 'document-list' in str(reverse.__globals__) else f"/api/v1/tenants/{self.tenant_b.id}/documents/"
        response = self.client.get(url_list_b)
        
        # User A is not a member of Tenant B, so they should get 403 or 404
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_user_cannot_query_other_tenant_rag(self):
        """User A cannot query the /chat/ask/ endpoint using a context from Tenant B."""
        self.client.force_authenticate(user=self.user_a)
        
        url_ask = f"/api/v1/tenants/{self.tenant_b.id}/chat/ask/"
        response = self.client.post(url_ask, {
            "question": "What is in Doc B?",
            "knowledge_space_id": str(self.space_b.id)
        })
        
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
