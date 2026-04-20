"""
DocPilot AI — Documents API Views
"""

import logging
import os

from django.http import FileResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit_observability.services import log_action
from apps.core.constants import AuditAction, DocumentStatus, JobType
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

    def get_throttles(self):
        from rest_framework.throttling import ScopedRateThrottle
        if self.request.method == 'POST':
            self.throttle_scope = 'upload'
            return [ScopedRateThrottle()]
        return []

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

        # Create processing job (will be picked up by Celery)
        DocumentProcessingJob.objects.create(
            document_version=version,
            job_type=JobType.INDEX,
        )

        # Trigger async ingestion pipeline
        try:
            from apps.ingestion.tasks import process_document_task
            process_document_task.delay(str(version.id))
        except Exception as e:
            logger.warning(f"Could not dispatch ingestion task: {e}")

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
        log_action(
            AuditAction.DOCUMENT_UPLOADED,
            user=request.user, tenant_id=tenant_id,
            resource_type="document", resource_id=document.id,
            details={"file_name": file_obj.name, "size_bytes": file_meta["size_bytes"]},
            request=request,
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
        log_action(
            AuditAction.DOCUMENT_DELETED,
            user=request.user, tenant_id=tenant_id,
            resource_type="document", resource_id=document_id,
            details={"title": document.title},
            request=request,
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


class DocumentDownloadView(APIView):
    """
    GET /api/v1/tenants/{tenant_id}/documents/{document_id}/download/

    Serve document file directly (local storage) or return presigned URL (S3/R2).
    Requires tenant membership — enforces ownership boundary.
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id, document_id):
        try:
            document = Document.objects.select_related("knowledge_space").prefetch_related("versions").get(
                id=document_id, tenant_id=tenant_id
            )
        except Document.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Document non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        version = document.current_version
        if not version:
            return Response(
                {"error": {"code": "no_version", "message": "Aucune version disponible pour ce document."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if storage.backend == "local":
            if not os.path.exists(version.file_path):
                return Response(
                    {"error": {"code": "file_missing", "message": "Fichier introuvable sur le serveur."}},
                    status=status.HTTP_404_NOT_FOUND,
                )
            file_handle = open(version.file_path, "rb")  # noqa: WPS515 — FileResponse closes it
            response = FileResponse(file_handle, content_type=version.mime_type or "application/octet-stream")
            response["Content-Disposition"] = f'attachment; filename="{version.file_name}"'
            return response

        # S3/R2 mode — generate a presigned URL
        import boto3
        from django.conf import settings as django_settings

        try:
            s3_client = boto3.client(
                "s3",
                endpoint_url=django_settings.AWS_S3_ENDPOINT_URL or None,
                aws_access_key_id=django_settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=django_settings.AWS_SECRET_ACCESS_KEY,
                region_name=django_settings.AWS_S3_REGION_NAME,
            )
            key = version.file_path.replace(f"s3://{django_settings.AWS_STORAGE_BUCKET_NAME}/", "")
            url = s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": django_settings.AWS_STORAGE_BUCKET_NAME,
                    "Key": key,
                    "ResponseContentDisposition": f'attachment; filename="{version.file_name}"',
                },
                ExpiresIn=300,
            )
            return Response({"download_url": url})
        except Exception as e:
            logger.error(f"Failed to generate presigned URL for document {document_id}: {e}")
            return Response(
                {"error": {"code": "storage_error", "message": "Impossible de générer le lien de téléchargement."}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
