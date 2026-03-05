"""
DocPilot AI — Ingestion Celery Tasks

Async pipeline: upload → parse → chunk → embed → store.
"""

import logging

from celery import shared_task
from django.utils import timezone

from apps.core.constants import DocumentStatus, JobStatus

logger = logging.getLogger("apps.ingestion")


@shared_task(
    bind=True,
    name="ingestion.process_document",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def process_document_task(self, document_version_id: str):
    """
    Full ingestion pipeline for a document version:
    1. Parse PDF → extract text per page
    2. Chunk text → overlapping windows
    3. Generate embeddings → OpenAI
    4. Store chunks + embeddings in DB

    Triggered after document upload.
    """
    from apps.documents.models import DocumentProcessingJob, DocumentVersion
    from apps.ingestion.infrastructure.chunking.text_chunker import chunk_text
    from apps.ingestion.infrastructure.embeddings.embedding_service import generate_embeddings
    from apps.ingestion.infrastructure.parsers.pdf_parser import parse_pdf
    from apps.ingestion.models import DocumentChunk

    logger.info(f"Starting ingestion for version {document_version_id}")

    # Get version + job
    try:
        version = DocumentVersion.objects.select_related(
            "document__tenant", "document__knowledge_space"
        ).get(id=document_version_id)
    except DocumentVersion.DoesNotExist:
        logger.error(f"DocumentVersion {document_version_id} not found")
        return

    document = version.document
    job = DocumentProcessingJob.objects.filter(
        document_version=version,
        status=JobStatus.QUEUED,
    ).first()

    if not job:
        logger.warning(f"No queued job found for version {document_version_id}")
        return

    # Mark as running
    job.status = JobStatus.RUNNING
    job.started_at = timezone.now()
    job.save(update_fields=["status", "started_at", "updated_at"])

    document.status = DocumentStatus.PROCESSING
    document.save(update_fields=["status", "updated_at"])

    version.indexing_status = DocumentStatus.PROCESSING
    version.save(update_fields=["indexing_status", "updated_at"])

    try:
        # =====================
        # Step 1: Parse PDF
        # =====================
        logger.info(f"Step 1/4: Parsing PDF — {version.file_path}")
        pages = parse_pdf(version.file_path)

        if not pages:
            raise ValueError("Aucune page avec du texte trouvée dans le PDF.")

        # Update page count
        version.page_count = len(pages)
        version.save(update_fields=["page_count", "updated_at"])

        # =====================
        # Step 2: Chunk text
        # =====================
        logger.info(f"Step 2/4: Chunking — {len(pages)} pages")
        chunks = chunk_text(pages, chunk_size=500, chunk_overlap=50)

        if not chunks:
            raise ValueError("Aucun chunk créé à partir du texte extrait.")

        # =====================
        # Step 3: Generate embeddings
        # =====================
        logger.info(f"Step 3/4: Embedding — {len(chunks)} chunks")
        texts = [c.content for c in chunks]
        embeddings = generate_embeddings(texts)

        # =====================
        # Step 4: Store in DB
        # =====================
        logger.info(f"Step 4/4: Storing — {len(chunks)} chunks in DB")

        # Delete old chunks for this version (in case of reindex)
        DocumentChunk.objects.filter(document_version=version).delete()

        # Bulk create chunks
        chunk_objects = []
        for chunk, embedding in zip(chunks, embeddings):
            chunk_objects.append(DocumentChunk(
                document_version=version,
                tenant=document.tenant,
                knowledge_space=document.knowledge_space,
                chunk_index=chunk.index,
                content=chunk.content,
                page_number=chunk.page_number,
                token_count=chunk.token_count,
                embedding=embedding,
                metadata={
                    "document_title": document.title,
                    "file_name": version.file_name,
                },
            ))

        DocumentChunk.objects.bulk_create(chunk_objects)

        # Mark as indexed
        version.indexing_status = DocumentStatus.INDEXED
        version.save(update_fields=["indexing_status", "updated_at"])

        document.status = DocumentStatus.INDEXED
        document.save(update_fields=["status", "updated_at"])

        job.status = JobStatus.SUCCEEDED
        job.completed_at = timezone.now()
        job.metadata = {
            "pages_parsed": len(pages),
            "chunks_created": len(chunks),
            "total_tokens": sum(c.token_count for c in chunks),
        }
        job.save(update_fields=["status", "completed_at", "metadata", "updated_at"])

        logger.info(
            f"Ingestion completed for {document.title}: "
            f"{len(pages)} pages → {len(chunks)} chunks"
        )

    except Exception as e:
        logger.error(f"Ingestion failed for {document_version_id}: {e}", exc_info=True)

        # Mark as failed
        version.indexing_status = DocumentStatus.FAILED
        version.save(update_fields=["indexing_status", "updated_at"])

        document.status = DocumentStatus.FAILED
        document.save(update_fields=["status", "updated_at"])

        job.status = JobStatus.FAILED
        job.completed_at = timezone.now()
        job.error_message = str(e)[:2000]
        job.save(update_fields=["status", "completed_at", "error_message", "updated_at"])

        # Retry if retries left
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)
