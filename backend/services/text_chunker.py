from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_text(
    pages: List[Dict[str, Any]],
    filename: str | None = None,
    file_id: str | None = None
) -> List[Dict[str, Any]]:
    """
    Splits extracted PDF pages into smaller overlapping text chunks.

    Each chunk keeps document identity and page metadata so that
    retrieved answers can show accurate source references.

    Args:
        pages:
            List of dictionaries containing:
            - page_number
            - text

        filename:
            Original PDF filename.

        file_id:
            Unique uploaded file ID.

    Returns:
        List of chunk dictionaries containing:
        - chunk_index
        - page_number
        - page_chunk_index
        - filename
        - file_id
        - text
    """

    if not pages:
        return []

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = []

    chunk_index = 0

    for page in pages:

        # ------------------------------------------
        # Safely extract page information
        # ------------------------------------------

        page_text = page.get("text", "")
        page_number = page.get("page_number", 1)

        if not isinstance(page_text, str):
            page_text = str(page_text)

        # Skip empty pages
        if not page_text.strip():
            continue

        # ------------------------------------------
        # Split current page into chunks
        # ------------------------------------------

        page_chunks = text_splitter.split_text(
            page_text
        )

        for page_chunk_index, chunk in enumerate(page_chunks):

            chunks.append({
                # Global chunk position
                "chunk_index": chunk_index,

                # Page information
                "page_number": page_number,
                "page_chunk_index": page_chunk_index,

                # Document identity
                "filename": filename,
                "file_id": file_id,

                # Actual retrieved text
                "text": chunk
            })

            chunk_index += 1

    return chunks