import faiss
import numpy as np
import pickle
from pathlib import Path


# ---------------------------------
# Notebook storage directory
# ---------------------------------

NOTEBOOKS_DIR = Path("storage/notebooks")
NOTEBOOKS_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ---------------------------------
# Get notebook FAISS directory
# ---------------------------------

def get_notebook_faiss_dir(notebook_id):

    faiss_dir = (
        NOTEBOOKS_DIR /
        str(notebook_id) /
        "faiss"
    )

    faiss_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    return faiss_dir


# ---------------------------------
# Create FAISS index
# ---------------------------------

def create_faiss_index(embeddings):

    embeddings = np.asarray(
        embeddings
    ).astype("float32")

    if embeddings.ndim == 1:
        embeddings = embeddings.reshape(1, -1)

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(
        dimension
    )

    index.add(embeddings)

    return index


# ---------------------------------
# Save Notebook FAISS
# ---------------------------------

def save_notebook_faiss(
    index,
    chunks,
    notebook_id
):

    faiss_dir = get_notebook_faiss_dir(
        notebook_id
    )

    index_path = (
        faiss_dir /
        "index.faiss"
    )

    metadata_path = (
        faiss_dir /
        "metadata.pkl"
    )

    faiss.write_index(
        index,
        str(index_path)
    )

    with open(
        metadata_path,
        "wb"
    ) as f:

        pickle.dump(
            chunks,
            f
        )

    return index_path, metadata_path


# ---------------------------------
# Load Notebook FAISS
# ---------------------------------

def load_notebook_faiss(
    notebook_id
):

    faiss_dir = get_notebook_faiss_dir(
        notebook_id
    )

    index_path = (
        faiss_dir /
        "index.faiss"
    )

    metadata_path = (
        faiss_dir /
        "metadata.pkl"
    )

    if not index_path.exists():
        return None, []

    if not metadata_path.exists():
        return None, []

    index = faiss.read_index(
        str(index_path)
    )

    with open(
        metadata_path,
        "rb"
    ) as f:

        chunks = pickle.load(f)

    return index, chunks


# ---------------------------------
# Add chunks to Notebook FAISS
# ---------------------------------

def add_to_notebook_faiss(
    notebook_id,
    embeddings,
    chunks
):

    embeddings = np.asarray(
        embeddings
    ).astype("float32")

    if embeddings.ndim == 1:
        embeddings = embeddings.reshape(1, -1)

    index, existing_chunks = (
        load_notebook_faiss(
            notebook_id
        )
    )

    # ---------------------------------
    # Create first index
    # ---------------------------------

    if index is None:

        index = faiss.IndexFlatL2(
            embeddings.shape[1]
        )

    if index.ntotal != len(existing_chunks):
        raise ValueError(
            "FAISS index and metadata are out of alignment. "
            "Re-index this notebook before uploading more documents."
        )

    # ---------------------------------
    # Add vectors
    # ---------------------------------

    index.add(
        embeddings
    )

    # ---------------------------------
    # Add metadata
    # ---------------------------------

    existing_chunks.extend(
        chunks
    )

    # ---------------------------------
    # Save
    # ---------------------------------

    save_notebook_faiss(
        index,
        existing_chunks,
        notebook_id
    )

    return index, existing_chunks


# ---------------------------------
# Search Notebook FAISS
# ---------------------------------

def search_faiss(
    index,
    chunks,
    query_embedding,
    top_k=8,
    distance_threshold=1.2
):

    query_embedding = np.asarray(
        query_embedding
    ).astype("float32")

    if query_embedding.ndim == 1:
        query_embedding = query_embedding.reshape(
            1,
            -1
        )

    if index is None or not chunks or top_k <= 0:
        return []

    actual_k = min(
        int(top_k),
        index.ntotal,
        len(chunks)
    )

    if actual_k == 0:
        return []

    distances, indices = index.search(
        query_embedding,
        actual_k
    )

    results = []
    seen_chunks = set()

    for distance, index_position in zip(
        distances[0],
        indices[0]
    ):

        if index_position < 0:
            continue

        if not np.isfinite(distance) or distance > distance_threshold:
            continue

        if index_position >= len(chunks):
            continue

        chunk_data = chunks[index_position]

        # ---------------------------------
        # Normalize old metadata
        # ---------------------------------

        if isinstance(chunk_data, str):

            chunk_data = {
                "text": chunk_data,
                "file_id": None,
                "filename": None,
                "page_number": None,
                "page_chunk_index": None
            }

        elif not isinstance(chunk_data, dict):

            chunk_data = {
                "text": str(chunk_data),
                "file_id": None,
                "filename": None,
                "page_number": None,
                "page_chunk_index": None
            }

        text = str(chunk_data.get("text", "")).strip()
        if not text:
            continue

        document_key = (
            chunk_data.get("file_id")
            or chunk_data.get("filename")
            or "unknown"
        )
        chunk_key = (
            document_key,
            chunk_data.get("page_number"),
            chunk_data.get("chunk_index", index_position),
            text
        )
        if chunk_key in seen_chunks:
            continue
        seen_chunks.add(chunk_key)

        # ---------------------------------
        # Return complete source metadata
        # ---------------------------------

        results.append({
            "chunk_index": int(
                chunk_data.get(
                    "chunk_index",
                    index_position
                )
            ),

            "file_id": chunk_data.get(
                "file_id"
            ),

            "filename": chunk_data.get(
                "filename"
            ),

            "page_number": chunk_data.get(
                "page_number"
            ),

            "page_chunk_index": chunk_data.get(
                "page_chunk_index"
            ),

            "text": text,

            "distance": float(
                distance
            )
        })

    results.sort(key=lambda result: result["distance"])
    return results