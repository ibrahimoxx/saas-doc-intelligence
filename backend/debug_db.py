import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from apps.tenancy.models import TenantMembership

User = get_user_model()

with open('debug_output.txt', 'w') as f:
    try:
        user = User.objects.get(email='user@docpilot.dev')
        memberships = TenantMembership.objects.filter(user=user)
        f.write(f"User found: {user.id}\n")
        f.write(f"Memberships count: {memberships.count()}\n")
        for m in memberships:
            f.write(f"- Tenant: {m.tenant.name}, Role: {m.role}, Status: {m.status}\n")
    except Exception as e:
        f.write(f"Error: {str(e)}\n")
        
print("Debug finished")
