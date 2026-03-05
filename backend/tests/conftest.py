"""conftest.py — shared pytest fixtures for backend tests."""

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    """DRF API client for tests."""
    return APIClient()
