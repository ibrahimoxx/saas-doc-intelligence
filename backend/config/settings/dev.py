"""
DocPilot AI — Development Settings
"""

from .base import *  # noqa: F401,F403

# ===========================
# Debug
# ===========================
DEBUG = True

# ===========================
# Additional Apps (dev only)
# ===========================
INSTALLED_APPS += [  # noqa: F405
    "django_extensions",
]

# ===========================
# Logging (more verbose in dev)
# ===========================
LOGGING["loggers"]["apps"]["level"] = "DEBUG"  # noqa: F405
LOGGING["loggers"]["django.db.backends"] = {  # noqa: F405
    "handlers": ["console"],
    "level": "WARNING",
    "propagate": False,
}

# ===========================
# DRF (browseable API in dev)
# ===========================
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)

# ===========================
# Email (console in dev)
# ===========================
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ===========================
# CORS (relaxed in dev)
# ===========================
CORS_ALLOW_ALL_ORIGINS = True
