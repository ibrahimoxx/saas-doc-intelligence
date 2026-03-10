import pytest
import sys

if __name__ == '__main__':
    exit_code = pytest.main(['apps/tenancy/tests/test_isolation.py', 'apps/tenancy/tests/test_permissions.py', '-v'])
    sys.exit(exit_code)
