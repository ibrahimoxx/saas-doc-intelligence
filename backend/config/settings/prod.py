"""
DocPilot AI — Production Settings
"""

from .base import *  # noqa: F401,F403

# ===========================
# Debug OFF
# ===========================
DEBUG = False

# ===========================
# Security (strict)
# ===========================
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"

# ===========================
# Logging (JSON in prod)
# ===========================
LOGGING["handlers"]["console"]["formatter"] = "json"  # noqa: F405
LOGGING["loggers"]["apps"]["level"] = "INFO"  # noqa: F405
