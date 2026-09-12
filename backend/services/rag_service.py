from typing import List, Dict, Any

from backend.services.retrieval_service import retrieve_chunks
from backend.services.context_builder import build_context
from backend.services.llm_service import generate_answer


# ==================================================
# Answer Question Using Notebook RAG
# ==================================================

def answer_question(
    query: str,
    notebook_id: str,
    top_k: int = 8,
    distance_threshold: float = 1.2
) -> Dict[str, Any]:
    """
    Orchestrates the RAG pipeline to answer a question based on a specific notebook.
    
    Args:
        query: The student's question.
        notebook_id: The ID of the notebook to search within.
        top_k: Number of top chunks to retrieve.
        distance_threshold: Maximum distance threshold for chunk relevance.
        
    Returns:
        A dictionary containing the question, the generated answer, and source metadata.
    """

    # ------------------------------------------
    # 1. Retrieve relevant chunks
    # ------------------------------------------

    results = retrieve_chunks(
        query=query,
        notebook_id=notebook_id,
        top_k=top_k,
        distance_threshold=distance_threshold
    )

    # ------------------------------------------
    # 2. No relevant information found
    # ------------------------------------------

    if not results:

        return {
            "question": query,
            "answer": (
                "This question is outside the scope "
                "of the uploaded notes."
            ),
            "sources": []
        }

    # ------------------------------------------
    # 3. Normalize results to prevent type errors
    # ------------------------------------------
    # The "string indices must be integers" error occurs if `results` contains 
    # raw strings instead of dictionaries, and downstream services (like 
    # `build_context`) try to access keys like `chunk["text"]`.
    
    normalized_results = []
    for result in results:
        if isinstance(result, dict):
            normalized_results.append(result)
        elif isinstance(result, str):
            # If it's a raw string, wrap it in a dictionary
            normalized_results.append({
                "text": result,
                "file_id": None,
                "page_number": None,
                "chunk_index": None,
                "distance": None
            })
        else:
            # Fallback for any other unexpected types
            normalized_results.append({
                "text": str(result),
                "file_id": None,
                "page_number": None,
                "chunk_index": None,
                "distance": None
            })
    
    results = normalized_results

    # ------------------------------------------
    # 4. Build context
    # ------------------------------------------

    context = build_context(
        results
    )

    # ------------------------------------------
    # 5. Generate answer using LLM
    # ------------------------------------------

    answer = generate_answer(
        query=query,
        context=context
    )

    # ------------------------------------------
    # 6. Prepare sources
    # ------------------------------------------

    sources = [
        {
            "file_id": result.get("file_id"),
            "page_number": result.get("page_number"),
            "chunk_index": result.get("chunk_index"),
            "text": result.get("text"),
            "distance": result.get("distance")
        }
        for result in results
    ]

    # ------------------------------------------
    # 7. Return final response
    # ------------------------------------------

    return {
        "question": query,
        "answer": answer,
        "sources": sources
    }