"""
DocPilot AI — Vector Search Service

Similarity search against pgvector embeddings.
"""

import logging

from django.conf import settings
from pgvector.django import CosineDistance

from apps.ingestion.infrastructure.embeddings.embedding_service import generate_embeddings
from apps.ingestion.models import DocumentChunk

logger = logging.getLogger("apps.retrieval")


def search_chunks(
    query: str,
    tenant_id: str,
    knowledge_space_id: str | None = None,
    top_k: int | None = None,
    min_score: float | None = None,
) -> list[dict]:
    """
    Search for relevant document chunks using vector similarity.

    Args:
        query: User question
        tenant_id: Tenant scope
        knowledge_space_id: Optional space filter
        top_k: Number of results to return
        min_score: Minimum similarity score (0-1)

    Returns:
        List of dicts with chunk content, metadata, and similarity score
    """
    top_k = top_k or getattr(settings, "RAG_TOP_K_CHUNKS", 5)
    min_score = min_score or getattr(settings, "RAG_MIN_SIMILARITY_SCORE", 0.7)

    # Generate query embedding
    embeddings = generate_embeddings([query])
    if not embeddings:
        logger.warning("Failed to generate query embedding")
        return []

    query_embedding = embeddings[0]

    # Build queryset
    qs = DocumentChunk.objects.filter(
        tenant_id=tenant_id,
        embedding__isnull=False,
    )

    if knowledge_space_id:
        qs = qs.filter(knowledge_space_id=knowledge_space_id)

    # Annotate with cosine distance and order by similarity
    qs = qs.annotate(
        distance=CosineDistance("embedding", query_embedding)
    ).order_by("distance")

    # Filter by minimum similarity (distance = 1 - similarity)
    max_distance = 1.0 - min_score
    qs = qs.filter(distance__lte=max_distance)

    # Limit results
    results = qs[:top_k]

    chunks = []
    for chunk in results:
        similarity = 1.0 - chunk.distance
        chunks.append({
            "chunk_id": str(chunk.id),
            "content": chunk.content,
            "page_number": chunk.page_number,
            "token_count": chunk.token_count,
            "similarity": round(similarity, 4),
            "document_version_id": str(chunk.document_version_id),
            "metadata": chunk.metadata,
        })

    logger.info(
        f"Vector search: query='{query[:50]}...' → {len(chunks)} results "
        f"(top_k={top_k}, min_score={min_score})"
    )

    return chunks
