"""
DocPilot AI — RAG Pipeline

Retrieval-Augmented Generation: build context from chunks + call LLM.
"""

import logging

from django.conf import settings

logger = logging.getLogger("apps.retrieval")

# Prompt template for document Q&A with citations
SYSTEM_PROMPT = """Tu es DocPilot AI, un assistant expert en analyse de documents.

RÈGLES IMPORTANTES :
1. Réponds UNIQUEMENT en te basant sur les extraits de documents fournis ci-dessous.
2. Si la réponse ne se trouve pas dans les extraits, dis clairement "Je n'ai pas trouvé la réponse dans les documents disponibles."
3. Cite TOUJOURS tes sources avec le format [Source: nom_du_document, page X].
4. Sois précis, professionnel et structuré dans ta réponse.
5. Réponds dans la langue de la question.

EXTRAITS DE DOCUMENTS :
{context}
"""


def build_context(chunks: list[dict], max_tokens: int | None = None) -> str:
    """
    Build context string from retrieved chunks.

    Args:
        chunks: List of chunk dicts from vector search
        max_tokens: Maximum tokens for context

    Returns:
        Formatted context string
    """
    max_tokens = max_tokens or getattr(settings, "RAG_MAX_CONTEXT_TOKENS", 4000)

    context_parts = []
    total_tokens = 0

    for i, chunk in enumerate(chunks):
        if total_tokens + chunk["token_count"] > max_tokens:
            break

        doc_title = chunk.get("metadata", {}).get("document_title", "Document inconnu")
        page = chunk.get("page_number", "?")

        context_parts.append(
            f"--- Extrait {i + 1} (Source: {doc_title}, page {page}) ---\n"
            f"{chunk['content']}\n"
        )
        total_tokens += chunk["token_count"]

    return "\n".join(context_parts)


def ask_question(
    question: str,
    chunks: list[dict],
    model: str | None = None,
    temperature: float | None = None,
) -> dict:
    """
    Ask a question using RAG (retrieved chunks + LLM).

    Args:
        question: User's question
        chunks: Retrieved document chunks
        model: LLM model name
        temperature: Generation temperature

    Returns:
        Dict with answer, citations, model info, and token usage
    """
    model = model or getattr(settings, "RAG_LLM_MODEL", "gpt-4o-mini")
    temperature = temperature if temperature is not None else getattr(settings, "RAG_TEMPERATURE", 0.1)
    api_key = getattr(settings, "OPENAI_API_KEY", "")

    if not api_key:
        logger.warning("OPENAI_API_KEY not set — returning fallback answer")
        return {
            "answer": "⚠️ Clé OpenAI non configurée. Ajoutez OPENAI_API_KEY dans .env pour activer le RAG.",
            "citations": [],
            "model": model,
            "tokens_used": {"prompt": 0, "completion": 0, "total": 0},
            "status": "error",
        }

    if not chunks:
        return {
            "answer": "Je n'ai trouvé aucun extrait pertinent dans les documents disponibles pour répondre à cette question.",
            "citations": [],
            "model": model,
            "tokens_used": {"prompt": 0, "completion": 0, "total": 0},
            "status": "no_answer",
        }

    # Build context from chunks
    context = build_context(chunks)
    system_message = SYSTEM_PROMPT.format(context=context)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model=model,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": question},
            ],
            max_tokens=2000,
        )

        answer = response.choices[0].message.content or ""
        usage = response.usage

        # Build citations from chunks used
        citations = []
        for chunk in chunks:
            doc_title = chunk.get("metadata", {}).get("document_title", "Document inconnu")
            file_name = chunk.get("metadata", {}).get("file_name", "")
            citations.append({
                "chunk_id": chunk["chunk_id"],
                "document_title": doc_title,
                "file_name": file_name,
                "page_number": chunk.get("page_number"),
                "similarity": chunk.get("similarity"),
                "excerpt": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"],
            })

        logger.info(
            f"RAG answer generated: model={model}, "
            f"tokens={usage.total_tokens if usage else '?'}, "
            f"citations={len(citations)}"
        )

        return {
            "answer": answer,
            "citations": citations,
            "model": model,
            "tokens_used": {
                "prompt": usage.prompt_tokens if usage else 0,
                "completion": usage.completion_tokens if usage else 0,
                "total": usage.total_tokens if usage else 0,
            },
            "status": "ok",
        }

    except Exception as e:
        logger.error(f"RAG generation failed: {e}", exc_info=True)
        return {
            "answer": f"Erreur lors de la génération de la réponse : {str(e)}",
            "citations": [],
            "model": model,
            "tokens_used": {"prompt": 0, "completion": 0, "total": 0},
            "status": "error",
        }
