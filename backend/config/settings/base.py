"""
DocPilot AI — Django Base Settings

Common settings shared across all environments.
Environment-specific overrides in dev.py, staging.py, prod.py.
"""

import os
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

# ===========================
# Paths
# ===========================
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ===========================
# Security
# ===========================
SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="", cast=Csv())

# ===========================
# Application Definition
# ===========================
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
]

LOCAL_APPS = [
    "apps.core",
    "apps.identity_access",
    "apps.tenancy",
    "apps.documents",
    "apps.ingestion",
    "apps.retrieval",
    "apps.conversations",
    "apps.audit_observability",
    "apps.admin_ops",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ===========================
# Middleware
# ===========================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.RequestIdMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ===========================
# Database
# ===========================
import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL", default="postgres://postgres:postgres@localhost:5432/docpilot_dev"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# ===========================
# Custom User Model
# ===========================
AUTH_USER_MODEL = "identity_access.User"

# ===========================
# Authentication Backends
# ===========================
AUTHENTICATION_BACKENDS = [
    "apps.identity_access.backends.EmailBackend",
]

# ===========================
# Password Validation
# ===========================
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ===========================
# Internationalization
# ===========================
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ===========================
# Static Files
# ===========================
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ===========================
# Media Files (uploads)
# ===========================
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# ===========================
# Default Primary Key
# ===========================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ===========================
# Django REST Framework
# ===========================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {
        "login": "10/minute",
        "chat": "30/minute",
        "upload": "20/minute",
    },
}

# ===========================
# SimpleJWT
# ===========================
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=config("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", default=30, cast=int)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7, cast=int)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

# ===========================
# CORS
# ===========================
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="http://localhost:3000", cast=Csv())
CORS_ALLOW_CREDENTIALS = True

# ===========================
# Storage
# ===========================
STORAGE_BACKEND = config("STORAGE_BACKEND", default="local")
STORAGE_LOCAL_PATH = config("STORAGE_LOCAL_PATH", default=str(BASE_DIR / "media" / "documents"))

# S3/R2 settings (used when STORAGE_BACKEND=s3)
AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_ENDPOINT_URL = config("AWS_S3_ENDPOINT_URL", default="")
AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="auto")

# ===========================
# OpenAI
# ===========================
OPENAI_API_KEY = config("OPENAI_API_KEY", default="")

# ===========================
# Celery
# ===========================
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default="redis://localhost:6379/1")
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="redis://localhost:6379/2")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 600  # 10 minutes max per task
CELERY_TASK_SOFT_TIME_LIMIT = 540  # Soft limit at 9 minutes

# ===========================
# Sentry
# ===========================
SENTRY_DSN = config("SENTRY_DSN", default="")

if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )

# ===========================
# Logging
# ===========================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "apps.core.logging.JsonFormatter",
        },
        "simple": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}

# ===========================
# Upload Limits
# ===========================
MAX_UPLOAD_SIZE_MB = 50
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_UPLOAD_TYPES = ["application/pdf"]
ALLOWED_UPLOAD_EXTENSIONS = [".pdf"]

# ===========================
# RAG Settings
# ===========================
RAG_MAX_QUESTION_LENGTH = 2000
RAG_TOP_K_CHUNKS = 5
RAG_MIN_SIMILARITY_SCORE = 0.7
RAG_MAX_CONTEXT_TOKENS = 4000
RAG_EMBEDDING_MODEL = "text-embedding-3-small"
RAG_LLM_MODEL = "gpt-4o-mini"
RAG_TEMPERATURE = 0.1
