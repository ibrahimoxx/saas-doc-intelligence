"""
DocPilot AI — Smoke Test

Quick health check for API endpoints.
"""

import os
import sys
import requests

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")


def check_health():
    """Check health endpoint."""
    try:
        resp = requests.get(f"{BASE_URL}/api/v1/health/", timeout=5)
        if resp.status_code == 200 and resp.json().get("status") == "ok":
            print("✅ Health check: OK")
            return True
        else:
            print(f"❌ Health check: {resp.status_code} — {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False


def main():
    print("🔍 Running smoke tests...")
    print(f"   Base URL: {BASE_URL}\n")

    results = []
    results.append(check_health())

    # Add more checks as endpoints are built
    # results.append(check_auth_login())
    # results.append(check_tenants_list())

    print()
    if all(results):
        print("🎉 All smoke tests passed!")
        sys.exit(0)
    else:
        print("💥 Some smoke tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
