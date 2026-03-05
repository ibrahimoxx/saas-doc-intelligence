"""
DocPilot AI — RAG Pipeline

Retrieval-Augmented Generation: build context from chunks + call LLM.
Supports: OpenAI, Google Gemini (free), and dev mode (mock).
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
    """Build context string from retrieved chunks."""
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


def _build_citations(chunks: list[dict]) -> list[dict]:
    """Build citations list from chunks."""
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
    return citations


def _get_ai_provider() -> str:
    """Detect which AI provider to use based on env config."""
    gemini_key = getattr(settings, "GEMINI_API_KEY", "")
    openai_key = getattr(settings, "OPENAI_API_KEY", "")

    if gemini_key:
        return "gemini"
    if openai_key:
        return "openai"
    return "dev"


def _ask_openai(question: str, context: str, model: str, temperature: float) -> dict:
    """Call OpenAI GPT API."""
    from openai import OpenAI

    api_key = getattr(settings, "OPENAI_API_KEY", "")
    client = OpenAI(api_key=api_key)
    system_message = SYSTEM_PROMPT.format(context=context)

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

    return {
        "answer": answer,
        "model": model,
        "tokens_used": {
            "prompt": usage.prompt_tokens if usage else 0,
            "completion": usage.completion_tokens if usage else 0,
            "total": usage.total_tokens if usage else 0,
        },
    }


def _ask_gemini(question: str, context: str, model: str, temperature: float) -> dict:
    """Call Google Gemini API (free tier) via REST."""
    import json
    import urllib.request

    api_key = getattr(settings, "GEMINI_API_KEY", "")
    gemini_model = model if model.startswith("gemini") else "gemini-2.0-flash"

    system_message = SYSTEM_PROMPT.format(context=context)
    full_prompt = f"{system_message}\n\nQuestion: {question}"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}"

    payload = json.dumps({
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 2000,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    import time
    from urllib.error import HTTPError

    max_retries = 5
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))
            break
        except HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                delay = min(5 * (2 ** attempt), 60)
                logger.warning(f"Gemini API rate limit hit (429). Retrying in {delay}s...")
                time.sleep(delay)
            else:
                logger.error(f"Gemini API failed after {max_retries} retries: {e}")
                return {
                    "answer": "⚠️ **Quota Gemini atteint (Trop de requêtes)**\n\nGoogle Gemini limite l'utilisation à 15 requêtes par minute sur l'offre gratuite. Veuillez patienter une minute avant de poser une nouvelle question.",
                    "model": "gemini-quota-exceeded",
                    "tokens_used": {"prompt": 0, "completion": 0, "total": 0},
                }

    answer = result["candidates"][0]["content"]["parts"][0]["text"]

    return {
        "answer": answer,
        "model": gemini_model,
        "tokens_used": {
            "prompt": 0,
            "completion": 0,
            "total": 0,
        },
    }


def _ask_dev(question: str, context: str) -> dict:
    """Dev mode — returns a mock response. No API needed."""
    if context.strip():
        answer = (
            "🧪 **Mode Dev (pas d'API configurée)**\n\n"
            f"Votre question : *{question}*\n\n"
            "J'ai trouvé les extraits suivants dans vos documents :\n\n"
            f"{context[:500]}...\n\n"
            "💡 Pour obtenir de vraies réponses IA, ajoutez une clé API gratuite :\n"
            "- `GEMINI_API_KEY` (gratuit) dans `.env`\n"
            "- Obtenir sur https://aistudio.google.com/apikey"
        )
    else:
        answer = (
            "🧪 **Mode Dev (pas d'API configurée)**\n\n"
            f"Votre question : *{question}*\n\n"
            "Aucun document indexé trouvé. Uploadez un PDF d'abord.\n\n"
            "💡 Pour obtenir de vraies réponses IA, ajoutez `GEMINI_API_KEY` (gratuit) dans `.env`"
        )

    return {
        "answer": answer,
        "model": "dev-mock",
        "tokens_used": {"prompt": 0, "completion": 0, "total": 0},
    }


def ask_question(
    question: str,
    chunks: list[dict],
    model: str | None = None,
    temperature: float | None = None,
) -> dict:
    """
    Ask a question using RAG (retrieved chunks + LLM).
    Auto-detects provider: Gemini > OpenAI > Dev mode.
    """
    temperature = temperature if temperature is not None else getattr(settings, "RAG_TEMPERATURE", 0.1)
    provider = _get_ai_provider()

    if not chunks:
        return {
            "answer": "Je n'ai trouvé aucun extrait pertinent dans les documents disponibles pour répondre à cette question.",
            "citations": [],
            "model": model or provider,
            "tokens_used": {"prompt": 0, "completion": 0, "total": 0},
            "status": "no_answer",
        }

    # Build context from chunks
    context = build_context(chunks)

    try:
        if provider == "gemini":
            model = model or "gemini-2.0-flash"
            result = _ask_gemini(question, context, model, temperature)
        elif provider == "openai":
            model = model or getattr(settings, "RAG_LLM_MODEL", "gpt-4o-mini")
            result = _ask_openai(question, context, model, temperature)
        else:
            result = _ask_dev(question, context)

        logger.info(f"RAG answer generated: provider={provider}, model={result['model']}")

        return {
            "answer": result["answer"],
            "citations": _build_citations(chunks),
            "model": result["model"],
            "tokens_used": result["tokens_used"],
            "status": "ok",
        }

    except Exception as e:
        logger.error(f"RAG generation failed ({provider}): {e}", exc_info=True)
        return {
            "answer": f"Erreur lors de la génération de la réponse : {str(e)}",
            "citations": [],
            "model": model or provider,
            "tokens_used": {"prompt": 0, "completion": 0, "total": 0},
            "status": "error",
        }
