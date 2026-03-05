"""
DocPilot AI — Documents API Views
"""

import logging

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.constants import DocumentStatus, JobType
from apps.core.permissions import IsTenantManager, IsTenantMember
from apps.documents.api.serializers import (
    DocumentProcessingJobSerializer,
    DocumentSerializer,
    DocumentUploadSerializer,
)
from apps.documents.infrastructure.storage import storage
from apps.documents.models import Document, DocumentProcessingJob, DocumentVersion
from apps.tenancy.models import KnowledgeSpace

logger = logging.getLogger("apps.documents")


class DocumentsListView(APIView):
    """
    GET  /api/v1/tenants/{tenant_id}/documents/         — List documents
    POST /api/v1/tenants/{tenant_id}/documents/         — Upload new document
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id):
        """List documents for this tenant, optionally filtered by space."""
        space_id = request.query_params.get("space_id")

        qs = Document.objects.filter(tenant_id=tenant_id).select_related(
            "knowledge_space", "created_by"
        ).prefetch_related("versions")

        if space_id:
            qs = qs.filter(knowledge_space_id=space_id)

        # Search by title
        search = request.query_params.get("search")
        if search:
            qs = qs.filter(title__icontains=search)

        # Filter by status
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        serializer = DocumentSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, tenant_id):
        """Upload a new document (manager+ only)."""
        # Permission check: manager+
        from apps.core.constants import TenantRole
        from apps.tenancy.models import TenantMembership

        membership = TenantMembership.objects.filter(
            tenant_id=tenant_id, user=request.user, status="active"
        ).first()

        if not membership or membership.role not in TenantRole.MANAGER_ROLES:
            return Response(
                {"error": {"code": "forbidden", "message": "Seuls les gestionnaires peuvent uploader des documents."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_obj = serializer.validated_data["file"]
        knowledge_space_id = serializer.validated_data["knowledge_space_id"]
        title = serializer.validated_data.get("title") or file_obj.name

        # Verify knowledge space belongs to this tenant
        try:
            space = KnowledgeSpace.objects.get(id=knowledge_space_id, tenant_id=tenant_id)
        except KnowledgeSpace.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Espace de connaissance non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Create document
        document = Document.objects.create(
            tenant_id=tenant_id,
            knowledge_space=space,
            title=title,
            status=DocumentStatus.QUEUED,
            created_by=request.user,
        )

        # Save file via storage adapter
        file_meta = storage.save(
            tenant_id=str(tenant_id),
            space_id=str(knowledge_space_id),
            document_id=str(document.id),
            file_obj=file_obj,
            file_name=file_obj.name,
        )

        # Create version
        version = DocumentVersion.objects.create(
            document=document,
            version_number=1,
            file_name=file_obj.name,
            file_path=file_meta["path"],
            mime_type=file_obj.content_type or "application/pdf",
            file_size_bytes=file_meta["size_bytes"],
            file_hash=file_meta["file_hash"],
            indexing_status=DocumentStatus.QUEUED,
        )

        # Create processing job (will be picked up by Celery later)
        DocumentProcessingJob.objects.create(
            document_version=version,
            job_type=JobType.INDEX,
        )

        logger.info(
            "Document uploaded",
            extra={
                "tenant_id": str(tenant_id),
                "document_id": str(document.id),
                "file_name": file_obj.name,
                "file_size": file_meta["size_bytes"],
                "user_id": str(request.user.id),
            },
        )

        return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    """
    GET    /api/v1/tenants/{tenant_id}/documents/{document_id}/   — Get document details
    DELETE /api/v1/tenants/{tenant_id}/documents/{document_id}/   — Soft-delete document
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id, document_id):
        try:
            document = Document.objects.select_related(
                "knowledge_space", "created_by"
            ).prefetch_related("versions").get(
                id=document_id, tenant_id=tenant_id
            )
        except Document.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Document non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = DocumentSerializer(document)
        return Response(serializer.data)

    def delete(self, request, tenant_id, document_id):
        """Soft-delete a document (manager+ only)."""
        from apps.core.constants import TenantRole
        from apps.tenancy.models import TenantMembership

        membership = TenantMembership.objects.filter(
            tenant_id=tenant_id, user=request.user, status="active"
        ).first()

        if not membership or membership.role not in TenantRole.MANAGER_ROLES:
            return Response(
                {"error": {"code": "forbidden", "message": "Permission insuffisante."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            document = Document.objects.get(id=document_id, tenant_id=tenant_id)
        except Document.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Document non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Soft delete
        document.soft_delete()

        logger.info(
            "Document deleted",
            extra={
                "tenant_id": str(tenant_id),
                "document_id": str(document_id),
                "user_id": str(request.user.id),
            },
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentStatusView(APIView):
    """
    GET /api/v1/tenants/{tenant_id}/documents/{document_id}/status/

    Get processing status + jobs for a document.
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id, document_id):
        try:
            document = Document.objects.get(id=document_id, tenant_id=tenant_id)
        except Document.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Document non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_version = document.current_version
        jobs = []
        if current_version:
            jobs = DocumentProcessingJob.objects.filter(
                document_version=current_version
            ).order_by("-created_at")

        return Response({
            "document_id": str(document.id),
            "title": document.title,
            "status": document.status,
            "current_version": {
                "version_number": current_version.version_number if current_version else None,
                "indexing_status": current_version.indexing_status if current_version else None,
            },
            "jobs": DocumentProcessingJobSerializer(jobs, many=True).data,
        })
