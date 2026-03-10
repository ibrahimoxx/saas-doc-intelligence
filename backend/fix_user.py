import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from apps.tenancy.models import Tenant, TenantMembership

def assign_user():
    User = get_user_model()
    try:
        user = User.objects.get(email='user@docpilot.dev')
    except User.DoesNotExist:
        print("User does not exist")
        return

    tenant = Tenant.objects.first()
    if not tenant:
        print("No tenant exists")
        return

    mem, created = TenantMembership.objects.get_or_create(
        user=user, 
        tenant=tenant,
        defaults={'role': 'member'}
    )
    
    if created:
        print(f"✅ User {user.email} successfully added to tenant '{tenant.name}'")
    else:
        print(f"ℹ️ User {user.email} was ALREADY a member of '{tenant.name}'")
        
    print("All memberships for user:", TenantMembership.objects.filter(user=user).values('tenant__name', 'role'))

if __name__ == '__main__':
    assign_user()
