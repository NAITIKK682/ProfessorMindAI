from typing import List, Dict, Any

from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import (
    load_notebook_faiss,
    search_faiss
)


def retrieve_chunks(
    query: str,
    notebook_id: str,
    top_k: int = 8,
    distance_threshold: float = 1.2
) -> List[Dict[str, Any]]:

    # ------------------------------------------
    # Validate query
    # ------------------------------------------
    
    if not query or not query.strip():
        return []

    # ------------------------------------------
    # Load notebook-specific FAISS
    # ------------------------------------------

    index, chunks = load_notebook_faiss(
        notebook_id
    )

    # ------------------------------------------
    # No FAISS index or no chunks
    # ------------------------------------------

    if index is None or not chunks:
        return []

    # ------------------------------------------
    # Create query embedding
    # ------------------------------------------

    # Use the centralized generate_embeddings function 
    # to ensure model availability checks and proper formatting
    query_embedding = generate_embeddings(
        [query]
    )

    # ------------------------------------------
    # Search notebook FAISS
    # ------------------------------------------

    results = search_faiss(
        index=index,
        chunks=chunks,
        query_embedding=query_embedding,
        top_k=top_k,
        distance_threshold=distance_threshold
    )

    return results