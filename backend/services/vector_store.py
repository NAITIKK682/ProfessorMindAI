import faiss
import numpy as np
import pickle
from pathlib import Path


# ---------------------------------
# Notebook storage directory
# ---------------------------------

NOTEBOOKS_DIR = Path("storage/notebooks")
NOTEBOOKS_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------
# Get notebook FAISS directory
# ---------------------------------

def get_notebook_faiss_dir(notebook_id):

    faiss_dir = NOTEBOOKS_DIR / str(notebook_id) / "faiss"

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

    # Ensure embeddings are 2D to prevent IndexError on shape[1]
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

    # Ensure embeddings are 2D
    if embeddings.ndim == 1:
        embeddings = embeddings.reshape(1, -1)

    index, existing_chunks = (
        load_notebook_faiss(
            notebook_id
        )
    )

    # ---------------------------------
    # First source in notebook
    # ---------------------------------

    if index is None:

        index = faiss.IndexFlatL2(
            embeddings.shape[1]
        )

    # ---------------------------------
    # Add new vectors
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
    # Save updated notebook index
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

    # Ensure query embedding is 2D (1, dimension) for FAISS search
    if query_embedding.ndim == 1:
        query_embedding = query_embedding.reshape(1, -1)

    # Prevent requesting more vectors
    # than the index contains

    actual_k = min(
        top_k,
        index.ntotal
    )

    if actual_k == 0:
        return []

    distances, indices = index.search(
        query_embedding,
        actual_k
    )

    results = []

    for distance, index_position in zip(
        distances[0],
        indices[0]
    ):

        if index_position == -1:
            continue

        if distance > distance_threshold:
            continue

        # Prevent IndexError if index and metadata get out of sync
        if index_position >= len(chunks):
            continue

        # --------------------------------------------------
        # FIX: Prevent "string indices must be integers" error
        # --------------------------------------------------
        # The error occurs when `chunks` contains raw strings 
        # instead of dictionaries, and we try to access keys 
        # like `chunk["text"]`. We normalize the data here.
        
        chunk_data = chunks[index_position]
        
        if isinstance(chunk_data, str):
            chunk_data = {
                "text": chunk_data, 
                "file_id": None, 
                "page_number": None
            }
        elif not isinstance(chunk_data, dict):
            chunk_data = {
                "text": str(chunk_data), 
                "file_id": None, 
                "page_number": None
            }

        results.append({
            "chunk_index": int(index_position),
            "file_id": chunk_data.get("file_id"),
            "text": chunk_data.get("text", ""),
            "page_number": chunk_data.get("page_number"),
            "distance": float(distance)
        })

    return results