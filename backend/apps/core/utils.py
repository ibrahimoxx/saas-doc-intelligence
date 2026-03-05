"""
DocPilot AI — Core Utilities

Shared utility functions used across modules.
"""

import hashlib
import re
from typing import Any


def generate_slug(text: str) -> str:
    """Generate a URL-safe slug from text."""
    slug = text.lower().strip()
    slug = re.sub(r"[àáâãäå]", "a", slug)
    slug = re.sub(r"[èéêë]", "e", slug)
    slug = re.sub(r"[ìíîï]", "i", slug)
    slug = re.sub(r"[òóôõö]", "o", slug)
    slug = re.sub(r"[ùúûü]", "u", slug)
    slug = re.sub(r"[ç]", "c", slug)
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def compute_sha256(content: bytes) -> str:
    """Compute SHA-256 hash of bytes content."""
    return hashlib.sha256(content).hexdigest()


def truncate_text(text: str, max_length: int = 200) -> str:
    """Truncate text to max_length with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def safe_int(value: Any, default: int = 0) -> int:
    """Safely convert a value to int."""
    try:
        return int(value)
    except (ValueError, TypeError):
        return default
