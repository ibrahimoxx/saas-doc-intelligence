"""
DocPilot AI — PDF Parser

Extract text from PDF files using PyMuPDF (fitz).
"""

import logging
from dataclasses import dataclass

import fitz  # PyMuPDF

logger = logging.getLogger("apps.ingestion")


@dataclass
class ParsedPage:
    """Represents a single parsed page."""
    page_number: int
    text: str


def parse_pdf(file_path: str) -> list[ParsedPage]:
    """
    Parse a PDF file and extract text content per page.

    Args:
        file_path: Path to the PDF file

    Returns:
        List of ParsedPage with page number and text
    """
    pages = []

    try:
        doc = fitz.open(file_path)
        logger.info(f"Parsing PDF: {file_path} ({doc.page_count} pages)")

        for page_num in range(doc.page_count):
            page = doc[page_num]
            text = page.get_text("text").strip()

            if text:  # Skip empty pages
                pages.append(ParsedPage(
                    page_number=page_num + 1,
                    text=text,
                ))

        doc.close()
        logger.info(f"Parsed {len(pages)} non-empty pages from {file_path}")

    except Exception as e:
        logger.error(f"Failed to parse PDF {file_path}: {e}", exc_info=True)
        raise

    return pages
