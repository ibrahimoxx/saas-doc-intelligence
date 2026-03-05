"""
DocPilot AI — Embedding Service

Generate vector embeddings using OpenAI API, Google Gemini REST API, or dev mode.
Auto-detects provider: Gemini > OpenAI > dev.
"""

import json
import logging
import urllib.request
from typing import Optional

from django.conf import settings

logger = logging.getLogger("apps.ingestion")


def _get_embedding_provider() -> str:
    """Detect which embedding provider to use."""
    gemini_key = getattr(settings, "GEMINI_API_KEY", "")
    openai_key = getattr(settings, "OPENAI_API_KEY", "")

    if gemini_key:
        return "gemini"
    if openai_key:
        return "openai"
    return "dev"


def generate_embeddings(
    texts: list[str],
    model: Optional[str] = None,
) -> list[list[float]]:
    """
    Generate vector embeddings for a list of texts.
    Auto-detects provider: Gemini (free) > OpenAI > dev mode (zero vectors).
    """
    if not texts:
        return []

    provider = _get_embedding_provider()

    if provider == "gemini":
        return _embed_gemini(texts)
    elif provider == "openai":
        return _embed_openai(texts, model)
    else:
        logger.warning("No API key set — returning zero vectors for dev")
        return [[0.0] * 1536 for _ in texts]


def _embed_openai(texts: list[str], model: Optional[str] = None) -> list[list[float]]:
    """Generate embeddings using OpenAI."""
    from openai import OpenAI

    model = model or getattr(settings, "RAG_EMBEDDING_MODEL", "text-embedding-3-small")
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    client = OpenAI(api_key=api_key)

    response = client.embeddings.create(model=model, input=texts)
    embeddings = [item.embedding for item in response.data]

    logger.info(f"OpenAI: Generated {len(embeddings)} embeddings (model={model})")
    return embeddings


def _embed_gemini(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings using Google Gemini REST API (free tier).
    Uses direct HTTP requests to avoid SDK version issues.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    embeddings = []

    for text in texts:
        # Use the REST API directly — more reliable than the SDK
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"

        payload = json.dumps({
            "model": "models/gemini-embedding-001",
            "content": {
                "parts": [{"text": text}]
            },
            "taskType": "RETRIEVAL_DOCUMENT",
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        vec = result["embedding"]["values"]

        # Enforce exactly 1536 dims for pgvector compatibility
        if len(vec) > 1536:
            vec = vec[:1536]
        elif len(vec) < 1536:
            vec = vec + [0.0] * (1536 - len(vec))
        embeddings.append(vec)

    logger.info(f"Gemini REST: Generated {len(embeddings)} embeddings")
    return embeddings
