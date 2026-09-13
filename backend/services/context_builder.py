from typing import List, Dict, Any


def build_context(
    results: List[Dict[str, Any]]
) -> str:
    """
    Build grounded context for the LLM from retrieved FAISS chunks.

    Important architecture rule:

    - Filename and page number are provided as retrieval metadata.
    - The LLM uses the metadata to understand document structure.
    - The LLM is NOT responsible for generating source citations.
    - The backend separately returns authoritative source metadata
      to the frontend.

    Retrieved chunks are:
    1. Normalized
    2. Deduplicated
    3. Grouped by document
    4. Ordered by page and chunk index
    """

    if not results:
        return ""

    # =========================================================
    # 1. NORMALIZE & DEDUPLICATE
    # =========================================================

    unique_chunks: Dict[
        tuple,
        Dict[str, Any]
    ] = {}

    for result in results:

        # ---------------------------------
        # Defensive normalization
        # ---------------------------------

        if isinstance(result, str):

            result = {
                "text": result,
                "page_number": 0,
                "chunk_index": 0,
                "filename": "Unknown",
                "file_id": None
            }

        elif not isinstance(result, dict):

            result = {
                "text": str(result),
                "page_number": 0,
                "chunk_index": 0,
                "filename": "Unknown",
                "file_id": None
            }

        # ---------------------------------
        # Extract metadata
        # ---------------------------------

        text = str(
            result.get(
                "text",
                ""
            )
        ).strip()

        page_number = result.get(
            "page_number",
            0
        ) or 0

        chunk_index = result.get(
            "chunk_index",
            0
        ) or 0

        file_id = result.get(
            "file_id"
        )

        filename = result.get(
            "filename"
        )

        # ---------------------------------
        # Filename fallback
        # ---------------------------------

        if not filename:

            filename = (
                file_id
                or "Unknown Document"
            )

        # ---------------------------------
        # Skip empty chunks
        # ---------------------------------

        if not text:
            continue

        # ---------------------------------
        # Deduplication key
        #
        # Include document identity.
        # This prevents identical text on
        # different PDFs from being treated
        # as the same chunk.
        # ---------------------------------

        key = (
            file_id or filename,
            page_number,
            chunk_index,
            text
        )

        if key not in unique_chunks:

            unique_chunks[key] = {
                "text": text,
                "page_number": page_number,
                "chunk_index": chunk_index,
                "filename": filename,
                "file_id": file_id,
                "page_chunk_index": result.get(
                    "page_chunk_index"
                ),
                "distance": result.get(
                    "distance"
                )
            }

    normalized = list(
        unique_chunks.values()
    )

    if not normalized:
        return ""

    # =========================================================
    # 2. SORT RETRIEVED CHUNKS
    # =========================================================
    #
    # Group by document first, then page,
    # then original chunk position.
    #
    # This is safer when a notebook contains
    # multiple PDF files.
    # =========================================================

    normalized.sort(
        key=lambda x: (
            x.get("filename", ""),
            x.get("page_number", 0),
            x.get("chunk_index", 0)
        )
    )

    # =========================================================
    # 3. BUILD CONTEXT
    # =========================================================

    context_parts: List[str] = []

    current_file = None
    current_page = None

    for chunk in normalized:

        filename = chunk.get(
            "filename",
            "Unknown Document"
        )

        page_number = chunk.get(
            "page_number",
            0
        )

        chunk_index = chunk.get(
            "chunk_index",
            0
        )

        text = chunk.get(
            "text",
            ""
        ).strip()

        if not text:
            continue

        # ---------------------------------
        # New document
        # ---------------------------------

        if filename != current_file:

            if context_parts:
                context_parts.append("")

            context_parts.append(
                "=== DOCUMENT ==="
            )

            context_parts.append(
                f"Document: {filename}"
            )

            context_parts.append(
                "The following text was retrieved "
                "from this document."
            )

            context_parts.append(
                "================"
            )

            current_file = filename
            current_page = None

        # ---------------------------------
        # New page
        # ---------------------------------

        if page_number != current_page:

            context_parts.append("")

            context_parts.append(
                f"--- Retrieved Page {page_number} ---"
            )

            current_page = page_number

        # ---------------------------------
        # Chunk marker
        # ---------------------------------

        context_parts.append(
            f"[Retrieved Chunk {chunk_index}]"
        )

        # ---------------------------------
        # Actual lecture text
        # ---------------------------------

        context_parts.append(
            text
        )

    return "\n".join(
        context_parts
    )