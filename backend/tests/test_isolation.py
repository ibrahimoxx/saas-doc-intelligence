from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.tenancy.models import Tenant, TenantMembership, KnowledgeSpace
from apps.documents.models import Document
from apps.core.constants import TenantRole, DocumentStatus

User = get_user_model()


class TestTenantIsolation(APITestCase):
    """Test tenant isolation — User A cannot access Tenant B resources."""

    def setUp(self):
        self.user_a = User.objects.create_user(email="user_a@test.com", password="password123")
        self.tenant_a = Tenant.objects.create(name="Tenant A", slug="tenant-a")
        TenantMembership.objects.create(tenant=self.tenant_a, user=self.user_a, role=TenantRole.OWNER, status="active")
        self.space_a = KnowledgeSpace.objects.create(tenant=self.tenant_a, name="Space A", slug="space-a")
        self.doc_a = Document.objects.create(
            tenant=self.tenant_a, knowledge_space=self.space_a,
            title="Doc A", created_by=self.user_a, status=DocumentStatus.QUEUED,
        )

        self.user_b = User.objects.create_user(email="user_b@test.com", password="password123")
        self.tenant_b = Tenant.objects.create(name="Tenant B", slug="tenant-b")
        TenantMembership.objects.create(tenant=self.tenant_b, user=self.user_b, role=TenantRole.OWNER, status="active")
        self.space_b = KnowledgeSpace.objects.create(tenant=self.tenant_b, name="Space B", slug="space-b")
        self.doc_b = Document.objects.create(
            tenant=self.tenant_b, knowledge_space=self.space_b,
            title="Doc B", created_by=self.user_b, status=DocumentStatus.QUEUED,
        )

    def test_user_cannot_access_other_tenant_documents(self):
        """User A cannot list or access Tenant B documents."""
        self.client.force_authenticate(user=self.user_a)
        url = f"/api/v1/tenants/{self.tenant_b.id}/documents/"
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_user_cannot_query_other_tenant_rag(self):
        """User A cannot use the RAG endpoint on Tenant B's knowledge space."""
        self.client.force_authenticate(user=self.user_a)
        url = f"/api/v1/tenants/{self.tenant_b.id}/chat/ask/"
        response = self.client.post(url, {
            "question": "What is in Doc B?",
            "knowledge_space_id": str(self.space_b.id),
        })
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
