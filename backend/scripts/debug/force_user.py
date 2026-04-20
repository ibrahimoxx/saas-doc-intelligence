import os
import sys

# Setting up django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
import django
django.setup()

from django.contrib.auth import get_user_model
from apps.tenancy.models import Tenant, TenantMembership

User = get_user_model()

try:
    user = User.objects.get(email='user@docpilot.dev')
    tenant = Tenant.objects.first()
    
    if user and tenant:
        mem, created = TenantMembership.objects.get_or_create(
            user=user, 
            tenant=tenant,
            defaults={'role': 'member', 'status': 'active'}
        )
        mem.status = 'active'
        mem.save()
        print("SUCCESS")
except Exception as e:
    print(e)
