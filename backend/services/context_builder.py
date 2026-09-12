from typing import List, Dict, Any


def build_context(results: List[Dict[str, Any]]) -> str:
    """
    Builds a formatted context string from retrieved chunks for the LLM.
    Removes exact duplicates and sorts chunks by page number and chunk index.
    
    Handles both dictionary and string inputs defensively to prevent
    'string indices must be integers' errors.
    """

    if not results:
        return ""

    # --------------------------------------------------
    # 1. Normalize & deduplicate chunks
    # --------------------------------------------------

    unique_chunks: Dict[tuple, Dict[str, Any]] = {}

    for result in results:

        # Defensive: ensure result is a dictionary
        if isinstance(result, str):
            result = {"text": result, "page_number": 0, "chunk_index": 0}
        elif not isinstance(result, dict):
            result = {"text": str(result), "page_number": 0, "chunk_index": 0}

        # Safely extract text and metadata
        text = str(result.get("text", "")).strip()
        page_number = result.get("page_number", 0) or 0
        filename = result.get("filename", result.get("file_id", "Unknown"))

        # Skip empty text chunks
        if not text:
            continue

        # Deduplication key: same page + same text = duplicate
        key = (page_number, text)

        if key not in unique_chunks:
            unique_chunks[key] = {
                "text": text,
                "page_number": page_number,
                "chunk_index": result.get("chunk_index", 0) or 0,
                "filename": filename,
                "file_id": result.get("file_id"),
                "distance": result.get("distance"),
            }

    normalized = list(unique_chunks.values())

    if not normalized:
        return ""

    # --------------------------------------------------
    # 2. Sort by original PDF order
    # --------------------------------------------------
    # First: page number
    # Second: original chunk position

    normalized.sort(
        key=lambda x: (
            x.get("page_number", 0),
            x.get("chunk_index", 0)
        )
    )

    # --------------------------------------------------
    # 3. Build formatted context string
    # --------------------------------------------------

    context_parts: List[str] = []
    current_page: int | None = None
    current_file: str | None = None

    for chunk in normalized:

        page_number = chunk.get("page_number", 0)
        text = chunk.get("text", "").strip()
        filename = chunk.get("filename", "Unknown")

        if not text:
            continue

        # Add file header when source document changes
        if filename != current_file:
            context_parts.append(
                f"\n[Document: {filename}]"
            )
            current_file = filename
            current_page = None  # Reset page tracking for new document

        # Add page separator when page changes
        if page_number != current_page:
            context_parts.append(
                f"--- Page {page_number} ---"
            )
            current_page = page_number

        context_parts.append(text)

    return "\n".join(context_parts)