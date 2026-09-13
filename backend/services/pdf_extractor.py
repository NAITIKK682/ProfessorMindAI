import pymupdf
from pathlib import Path
from typing import List, Dict, Any


def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:

    pdf_path = Path(file_path)

    if not pdf_path.exists():
        raise FileNotFoundError("PDF file not found.")

    pages = []

    try:
        with pymupdf.open(pdf_path) as document:

            for page_number, page in enumerate(document, start=1):

                text = page.get_text("text")

                pages.append({
                    "page_number": page_number,
                    "text": text.strip()
                })

    except Exception as e:
        raise RuntimeError(
            f"Failed to extract text from PDF: {str(e)}"
        ) from e

    return pages