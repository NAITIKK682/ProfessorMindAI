import logging
from typing import Any, Dict

from backend.services.retrieval_service import retrieve_chunks
from backend.services.context_builder import build_context
from backend.services.llm_service import generate_answer


logger = logging.getLogger(__name__)


def answer_question(
    query: str,
    notebook_id: str,
    top_k: int = 8,
    distance_threshold: float = 1.2
) -> Dict[str, Any]:

    results = retrieve_chunks(
        query=query,
        notebook_id=notebook_id,
        top_k=top_k,
        distance_threshold=distance_threshold
    )

    if not isinstance(results, list) or not results:
        return {
            "question": query,
            "answer": (
                "This question is outside the scope "
                "of the uploaded notes."
            ),
            "sources": []
        }

    normalized_results = []

    for result in results:

        if isinstance(result, dict):

            normalized_results.append(
                result
            )

        elif isinstance(result, str):

            normalized_results.append({
                "text": result,
                "file_id": None,
                "filename": None,
                "page_number": None,
                "chunk_index": None,
                "page_chunk_index": None,
                "distance": None
            })

        else:

            normalized_results.append({
                "text": str(result),
                "file_id": None,
                "filename": None,
                "page_number": None,
                "chunk_index": None,
                "page_chunk_index": None,
                "distance": None
            })

    results = normalized_results

    # ---------------------------------
    # Build RAG context
    # ---------------------------------

    context = build_context(
        results
    )

    # ---------------------------------
    # Generate grounded answer
    # ---------------------------------

    answer = generate_answer(
        query=query,
        context=context
    )

    # Build unique source references from retrieved metadata, never from the
    # generated answer.
    unique_sources = {}

    for result in results:
        file_id = result.get("file_id")
        filename = result.get("filename")
        page_number = result.get("page_number")

        if page_number is None:
            continue

        source_key = (file_id or filename or "unknown", page_number)

        if source_key not in unique_sources:
            unique_sources[source_key] = {
                "file_id": file_id,
                "filename": filename,
                "page_number": page_number
            }

    sources = list(unique_sources.values())

    logger.info(
        "RAG query notebook=%s retrieved_chunks=%d sources=%s",
        notebook_id,
        len(results),
        [(source["filename"], source["page_number"]) for source in sources]
    )

    return {
        "question": query,
        "answer": answer,
        "sources": sources
    }