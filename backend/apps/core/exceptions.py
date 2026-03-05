"""
DocPilot AI — Core Exception Handler

Custom DRF exception handler that returns structured error responses
with request_id for support/debugging.
"""

import logging

from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("apps.core")


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error format:
    {
        "error": {
            "code": "string",
            "message": "string",
            "details": {} or [],
            "request_id": "string"
        }
    }
    """
    # Get request_id from request if available
    request = context.get("request")
    request_id = getattr(request, "request_id", "unknown") if request else "unknown"

    # Let DRF handle its known exceptions first
    response = exception_handler(exc, context)

    if response is not None:
        error_data = _build_error_response(
            code=_get_error_code(exc),
            message=_get_error_message(exc),
            details=response.data if isinstance(response.data, dict) else {"errors": response.data},
            request_id=request_id,
            status_code=response.status_code,
        )
        response.data = error_data
        return response

    # Handle Django exceptions not caught by DRF
    if isinstance(exc, DjangoValidationError):
        error_data = _build_error_response(
            code="validation_error",
            message="Erreur de validation.",
            details={"errors": exc.messages if hasattr(exc, "messages") else [str(exc)]},
            request_id=request_id,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        return Response(error_data, status=status.HTTP_400_BAD_REQUEST)

    # Log unexpected exceptions
    logger.exception(
        "Unhandled exception",
        extra={"request_id": request_id, "exception_type": type(exc).__name__},
    )

    error_data = _build_error_response(
        code="internal_server_error",
        message="Une erreur interne est survenue. Veuillez réessayer.",
        details={},
        request_id=request_id,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
    return Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _build_error_response(code: str, message: str, details: dict, request_id: str, status_code: int) -> dict:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details,
            "request_id": request_id,
        }
    }


def _get_error_code(exc) -> str:
    if isinstance(exc, DRFValidationError):
        return "validation_error"
    if isinstance(exc, Http404):
        return "not_found"
    if isinstance(exc, PermissionDenied):
        return "permission_denied"
    if isinstance(exc, APIException):
        return getattr(exc, "default_code", "api_error")
    return "unknown_error"


def _get_error_message(exc) -> str:
    if isinstance(exc, Http404):
        return "Ressource non trouvée."
    if isinstance(exc, PermissionDenied):
        return "Accès refusé."
    if hasattr(exc, "detail"):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list):
            return detail[0] if detail else "Erreur de validation."
    return str(exc)


# ===========================
# Custom Business Exceptions
# ===========================

class BusinessException(APIException):
    """Base exception for business logic errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "business_error"
    default_detail = "Erreur métier."


class TenantAccessDenied(APIException):
    """Raised when user tries to access a resource from another tenant."""
    status_code = status.HTTP_403_FORBIDDEN
    default_code = "tenant_access_denied"
    default_detail = "Accès refusé à cette organisation."


class TenantNotFound(APIException):
    """Raised when the specified tenant does not exist."""
    status_code = status.HTTP_404_NOT_FOUND
    default_code = "tenant_not_found"
    default_detail = "Organisation non trouvée."


class DocumentProcessingError(BusinessException):
    """Raised when document processing fails."""
    default_code = "document_processing_error"
    default_detail = "Erreur lors du traitement du document."


class RAGInsufficientContext(BusinessException):
    """Raised when RAG retrieval doesn't find sufficient context."""
    status_code = status.HTTP_200_OK  # Not an error, just no answer
    default_code = "insufficient_context"
    default_detail = "Contexte insuffisant pour répondre à cette question."


class UploadValidationError(BusinessException):
    """Raised when an uploaded file fails validation."""
    default_code = "upload_validation_error"
    default_detail = "Le fichier uploadé ne respecte pas les critères requis."
