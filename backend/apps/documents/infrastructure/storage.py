"""
DocPilot AI — Storage Adapter

Abstraction layer for file storage (local dev / S3/R2 production).
"""

import hashlib
import os
import uuid
from pathlib import Path

from django.conf import settings


class StorageAdapter:
    """
    File storage adapter.

    Uses local filesystem in dev, S3-compatible in staging/prod.
    All files are organized by: tenant_id / space_id / document_id / filename
    """

    def __init__(self):
        self.backend = getattr(settings, "STORAGE_BACKEND", "local")
        self.local_path = getattr(settings, "STORAGE_LOCAL_PATH", "./media/documents")

    def save(self, tenant_id: str, space_id: str, document_id: str, file_obj, file_name: str) -> dict:
        """
        Save a file and return metadata.

        Returns:
            dict with keys: path, size_bytes, file_hash
        """
        if self.backend == "local":
            return self._save_local(tenant_id, space_id, document_id, file_obj, file_name)
        else:
            return self._save_s3(tenant_id, space_id, document_id, file_obj, file_name)

    def delete(self, file_path: str) -> bool:
        """Delete a file by its stored path."""
        if self.backend == "local":
            return self._delete_local(file_path)
        else:
            return self._delete_s3(file_path)

    def _save_local(self, tenant_id: str, space_id: str, document_id: str, file_obj, file_name: str) -> dict:
        """Save file to local filesystem."""
        # Build directory path
        dir_path = Path(self.local_path) / tenant_id / space_id / document_id
        dir_path.mkdir(parents=True, exist_ok=True)

        # Generate unique filename to avoid collisions
        ext = Path(file_name).suffix
        safe_name = f"{uuid.uuid4().hex[:12]}{ext}"
        file_path = dir_path / safe_name

        # Write file and compute hash
        sha256 = hashlib.sha256()
        size_bytes = 0

        with open(file_path, "wb") as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)
                sha256.update(chunk)
                size_bytes += len(chunk)

        return {
            "path": str(file_path),
            "size_bytes": size_bytes,
            "file_hash": sha256.hexdigest(),
        }

    def _delete_local(self, file_path: str) -> bool:
        """Delete file from local filesystem."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except OSError:
            pass
        return False

    def _save_s3(self, tenant_id: str, space_id: str, document_id: str, file_obj, file_name: str) -> dict:
        """Save file to S3/R2 (placeholder — will be implemented for staging/prod)."""
        import boto3

        s3_client = boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )

        ext = Path(file_name).suffix
        key = f"{tenant_id}/{space_id}/{document_id}/{uuid.uuid4().hex[:12]}{ext}"

        # Read full file for upload + hash
        file_content = file_obj.read()
        file_hash = hashlib.sha256(file_content).hexdigest()

        s3_client.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=key,
            Body=file_content,
            ContentType="application/pdf",
        )

        return {
            "path": f"s3://{settings.AWS_STORAGE_BUCKET_NAME}/{key}",
            "size_bytes": len(file_content),
            "file_hash": file_hash,
        }

    def _delete_s3(self, file_path: str) -> bool:
        """Delete file from S3/R2."""
        import boto3

        try:
            s3_client = boto3.client(
                "s3",
                endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )

            # Extract key from path
            key = file_path.replace(f"s3://{settings.AWS_STORAGE_BUCKET_NAME}/", "")
            s3_client.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
            return True
        except Exception:
            return False


# Singleton
storage = StorageAdapter()
