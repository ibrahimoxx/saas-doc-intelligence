import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from apps.retrieval.api.admin_views import AdminStatsView, AdminRecentQueriesView

User = get_user_model()
factory = APIRequestFactory()

# Get the superuser
admin_user = User.objects.filter(is_superuser=True).first()
if not admin_user:
    print("NO SUPERUSER FOUND. Did you run createsuperuser?")
    exit(1)
print(f"Testing with superuser: {admin_user.email}")

# Test Stats
request = factory.get('/api/v1/admin/stats/')
force_authenticate(request, user=admin_user)
view = AdminStatsView.as_view()

print("\n--- Testing Admin Stats ---")
try:
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Data: {response.data}")
except Exception as e:
    print(f"Error: {e}")

# Test Recent Queries
request = factory.get('/api/v1/admin/queries/recent/')
force_authenticate(request, user=admin_user)
view = AdminRecentQueriesView.as_view()

print("\n--- Testing Recent Queries ---")
try:
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Data: {response.data}")
except Exception as e:
    print(f"Error: {e}")
