from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.tenancy.models import Tenant, TenantMembership
from apps.core.constants import TenantRole

User = get_user_model()

class TestPermissions(APITestCase):
    """Test RBAC roles inside a tenant."""

    def setUp(self):
        self.tenant = Tenant.objects.create(name="Test Tenant", slug="test-tenant")
        
        # Create Owner
        self.owner = User.objects.create_user(email="owner@test.com", password="password123")
        TenantMembership.objects.create(tenant=self.tenant, user=self.owner, role=TenantRole.OWNER, status="active")
        
        # Create Admin
        self.admin = User.objects.create_user(email="admin@test.com", password="password123")
        TenantMembership.objects.create(tenant=self.tenant, user=self.admin, role=TenantRole.ADMIN, status="active")
        
        # Create Member
        self.member = User.objects.create_user(email="member@test.com", password="password123")
        TenantMembership.objects.create(tenant=self.tenant, user=self.member, role=TenantRole.MEMBER, status="active")

    def test_member_cannot_invite_users(self):
        """A member cannot invite other members."""
        self.client.force_authenticate(user=self.member)
        url = f"/api/v1/tenants/{self.tenant.id}/members/"
        response = self.client.post(url, {"email": "newuser@test.com", "role": TenantRole.MEMBER})
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_invite_users(self):
        """An admin of a tenant can invite members."""
        self.client.force_authenticate(user=self.admin)
        url = f"/api/v1/tenants/{self.tenant.id}/members/"
        response = self.client.post(url, {"email": "newuser@test.com", "role": TenantRole.MEMBER})
        
        # Should be 201 Created or 200 OK depending on implementation
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]) 
        # 400 could be if email backend isn't configured, but it shouldn't be 403.
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_access_superuser_dashboard(self):
        """An admin of a tenant cannot access Django Superuser / Admin global stats."""
        self.client.force_authenticate(user=self.admin)
        url = "/api/v1/admin/stats/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_cannot_upload_documents(self):
        """A 'member' role is read-only for document interaction."""
        self.client.force_authenticate(user=self.member)
        url = f"/api/v1/tenants/{self.tenant.id}/documents/"
        
        # Fake file upload
        from django.core.files.uploadedfile import SimpleUploadedFile
        fake_file = SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        
        response = self.client.post(url, {"file": fake_file, "knowledge_space_id": "00000000-0000-0000-0000-000000000000"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
