"""
DocPilot AI — Embedding Service

Generate vector embeddings using OpenAI API.
"""

import logging
from typing import Optional

from django.conf import settings

logger = logging.getLogger("apps.ingestion")


def generate_embeddings(
    texts: list[str],
    model: Optional[str] = None,
) -> list[list[float]]:
    """
    Generate vector embeddings for a list of texts.

    Args:
        texts: List of text strings to embed
        model: Embedding model name (default from settings)

    Returns:
        List of embedding vectors (list of floats)
    """
    if not texts:
        return []

    model = model or getattr(settings, "RAG_EMBEDDING_MODEL", "text-embedding-3-small")
    api_key = getattr(settings, "OPENAI_API_KEY", "")

    if not api_key:
        logger.warning("OPENAI_API_KEY not set — returning zero vectors for dev")
        # Return zero vectors for development without API key
        return [[0.0] * 1536 for _ in texts]

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        # OpenAI supports batch embedding up to 2048 items
        response = client.embeddings.create(
            model=model,
            input=texts,
        )

        embeddings = [item.embedding for item in response.data]

        logger.info(
            f"Generated {len(embeddings)} embeddings",
            extra={"model": model, "total_texts": len(texts)},
        )

        return embeddings

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}", exc_info=True)
        raise
