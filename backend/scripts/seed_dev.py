"""
DocPilot AI — Seed Development Data

Creates test data for local development:
- 1 superuser
- 1 tenant with a default knowledge space
- 1 tenant membership (owner)
"""

import os
import sys

import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.core.utils import generate_slug
from apps.identity_access.models import User
from apps.tenancy.models import KnowledgeSpace, Tenant, TenantMembership


def seed():
    print("🌱 Seeding development data...")

    # Create admin user
    admin_email = "admin@docpilot.dev"
    if User.objects.filter(email=admin_email).exists():
        admin_user = User.objects.get(email=admin_email)
        print(f"  ℹ️  User already exists: {admin_email}")
    else:
        admin_user = User.objects.create_superuser(
            email=admin_email,
            password="admin123456",
            full_name="Admin Dev",
        )
        print(f"  ✅ User created: {admin_email} (password: admin123456)")

    # Create tenant
    tenant_slug = "demo-clinic"
    if Tenant.objects.filter(slug=tenant_slug).exists():
        tenant = Tenant.objects.get(slug=tenant_slug)
        print(f"  ℹ️  Tenant already exists: {tenant.name}")
    else:
        tenant = Tenant.objects.create(
            name="Cabinet Démo",
            slug=tenant_slug,
            status="active",
        )
        print(f"  ✅ Tenant created: {tenant.name}")

    # Create membership
    membership, created = TenantMembership.objects.get_or_create(
        tenant=tenant,
        user=admin_user,
        defaults={"role": "owner", "status": "active"},
    )
    if created:
        print(f"  ✅ Membership created: {admin_user.email} → {tenant.name} (owner)")
    else:
        print(f"  ℹ️  Membership already exists")

    # Create default knowledge space
    space_slug = "general"
    if KnowledgeSpace.objects.filter(tenant=tenant, slug=space_slug).exists():
        print(f"  ℹ️  Knowledge space already exists: {space_slug}")
    else:
        KnowledgeSpace.objects.create(
            tenant=tenant,
            name="Général",
            slug=space_slug,
            description="Espace de connaissance par défaut",
            created_by=admin_user,
        )
        print(f"  ✅ Knowledge space created: Général")

    print("\n🎉 Seed complete!")
    print(f"   Login: {admin_email} / admin123456")
    print(f"   Tenant: {tenant.name} ({tenant.slug})")


if __name__ == "__main__":
    seed()
