from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.tenancy.models import Tenant, TenantMembership

User = get_user_model()

class Command(BaseCommand):
    help = 'Assigns user@docpilot.dev to the first tenant'

    def handle(self, *args, **options):
        try:
            user = User.objects.get(email='user@docpilot.dev')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('User does not exist'))
            return

        tenant = Tenant.objects.first()
        if not tenant:
            self.stdout.write(self.style.ERROR('No tenant exists'))
            return

        mem, created = TenantMembership.objects.get_or_create(
            user=user, 
            tenant=tenant,
            defaults={'role': 'member', 'status': 'active'}
        )
        
        if not created and mem.status != 'active':
            mem.status = 'active'
            mem.save()
            self.stdout.write(self.style.WARNING(f"Updated status to active for {user.email}"))
            
        self.stdout.write(self.style.SUCCESS(f"User {user.email} is member of {tenant.name} with status {mem.status}"))
