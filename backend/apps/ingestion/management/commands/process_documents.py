"""
Django management command to process pending documents synchronously.
Useful for dev without Celery.

Usage:
    python manage.py process_documents
"""

from django.core.management.base import BaseCommand

from apps.core.constants import DocumentStatus, JobStatus
from apps.documents.models import DocumentProcessingJob, DocumentVersion


class Command(BaseCommand):
    help = "Process all pending documents (parse → chunk → embed → store). No Celery needed."

    def handle(self, *args, **options):
        from apps.ingestion.tasks import process_document_task

        pending_versions = DocumentVersion.objects.filter(
            indexing_status__in=[DocumentStatus.QUEUED, DocumentStatus.FAILED]
        ).select_related("document")

        if not pending_versions.exists():
            self.stdout.write(self.style.WARNING("Aucun document en attente."))
            return

        self.stdout.write(f"\n[INFO] {pending_versions.count()} document(s) en attente\n")

        for version in pending_versions:
            self.stdout.write(f"  -> Traitement de : {version.document.title} (v{version.version_number})")

            # Make sure there's a queued job
            job, _ = DocumentProcessingJob.objects.get_or_create(
                document_version=version,
                status=JobStatus.QUEUED,
                defaults={"job_type": "INDEX"},
            )

            try:
                # Call the task function directly (synchronous)
                process_document_task(document_version_id=str(version.id))
                self.stdout.write(self.style.SUCCESS(f"    [OK] Terminé !"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"    [FAIL] Erreur : {e}"))

        self.stdout.write(self.style.SUCCESS("\n[DONE] Traitement terminé !\n"))
