"""
DocPilot AI — Text Chunking Service

Split parsed text into overlapping chunks for embedding.
"""

import logging
from dataclasses import dataclass

import tiktoken

logger = logging.getLogger("apps.ingestion")


@dataclass
class TextChunk:
    """A chunk of text with metadata."""
    index: int
    content: str
    page_number: int | None
    token_count: int


def chunk_text(
    pages: list,
    chunk_size: int = 500,
    chunk_overlap: int = 50,
    model: str = "text-embedding-3-small",
) -> list[TextChunk]:
    """
    Split parsed pages into overlapping chunks.

    Strategy:
    - Concatenate all page text with page markers
    - Split by paragraphs, then by sentences if needed
    - Create overlapping windows of ~chunk_size tokens

    Args:
        pages: List of ParsedPage objects
        chunk_size: Target tokens per chunk
        chunk_overlap: Overlap tokens between chunks
        model: Tokenizer model name

    Returns:
        List of TextChunk objects
    """
    try:
        enc = tiktoken.encoding_for_model(model)
    except Exception:
        enc = tiktoken.get_encoding("cl100k_base")

    # Build paragraphs with page tracking
    paragraphs = []
    for page in pages:
        for para in page.text.split("\n\n"):
            para = para.strip()
            if para and len(para) > 10:  # Skip very short fragments
                paragraphs.append({
                    "text": para,
                    "page": page.page_number,
                    "tokens": len(enc.encode(para)),
                })

    if not paragraphs:
        logger.warning("No paragraphs found after splitting")
        return []

    # Build chunks with overlap
    chunks = []
    current_text = ""
    current_tokens = 0
    current_page = paragraphs[0]["page"]
    chunk_index = 0

    for para in paragraphs:
        para_tokens = para["tokens"]

        # If adding this paragraph exceeds chunk_size, finalize current chunk
        if current_tokens + para_tokens > chunk_size and current_text:
            chunks.append(TextChunk(
                index=chunk_index,
                content=current_text.strip(),
                page_number=current_page,
                token_count=current_tokens,
            ))
            chunk_index += 1

            # Keep overlap from the end of current text
            if chunk_overlap > 0:
                overlap_text = _get_tail_tokens(current_text, chunk_overlap, enc)
                current_text = overlap_text + "\n\n" + para["text"]
                current_tokens = len(enc.encode(current_text))
            else:
                current_text = para["text"]
                current_tokens = para_tokens
        else:
            if current_text:
                current_text += "\n\n" + para["text"]
            else:
                current_text = para["text"]
            current_tokens += para_tokens

        current_page = para["page"]

    # Don't forget the last chunk
    if current_text.strip():
        chunks.append(TextChunk(
            index=chunk_index,
            content=current_text.strip(),
            page_number=current_page,
            token_count=len(enc.encode(current_text.strip())),
        ))

    logger.info(f"Created {len(chunks)} chunks (avg {sum(c.token_count for c in chunks) // max(len(chunks), 1)} tokens)")
    return chunks


def _get_tail_tokens(text: str, n_tokens: int, enc) -> str:
    """Get the last n_tokens from text."""
    tokens = enc.encode(text)
    if len(tokens) <= n_tokens:
        return text
    return enc.decode(tokens[-n_tokens:])
