from fastapi import APIRouter, HTTPException
from pathlib import Path
from typing import List, Dict, Any

from backend.database import SessionLocal
from backend.models.document import Document
from backend.models.notebook import Notebook

from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import (
    load_notebook_faiss,
    save_notebook_faiss,
    create_faiss_index
)

router = APIRouter()

# --------------------------------------------------
# Base storage directory
# --------------------------------------------------
NOTEBOOKS_DIR = Path("storage/notebooks")


# ==================================================
# 1. GET ALL NOTEBOOKS WITH THEIR DOCUMENTS
# ==================================================

@router.get("/documents")
def get_all_documents() -> Dict[str, Any]:
    db = SessionLocal()

    try:
        notebooks = (
            db.query(Notebook)
            .order_by(Notebook.created_at.desc())
            .all()
        )

        result = []

        for notebook in notebooks:
            documents = (
                db.query(Document)
                .filter(Document.notebook_id == notebook.notebook_id)
                .all()
            )

            result.append({
                "notebook_id": notebook.notebook_id,
                "notebook_name": notebook.name,
                "description": notebook.description,
                "created_at": notebook.created_at,
                "total_documents": len(documents),
                "documents": [
                    {
                        "file_id": doc.file_id,
                        "filename": doc.filename,
                        "stored_as": doc.stored_as,
                        "total_pages": doc.total_pages,
                        "total_chunks": doc.total_chunks,
                        "embedding_dimension": doc.embedding_dimension,
                        "status": doc.status,
                        "uploaded_at": doc.uploaded_at
                    }
                    for doc in documents
                ]
            })

        return {
            "total_notebooks": len(notebooks),
            "notebooks": result
        }

    finally:
        db.close()


# ==================================================
# 2. GET DOCUMENTS OF ONE NOTEBOOK
# ==================================================

@router.get("/notebooks/{notebook_id}/documents")
def get_notebook_documents(notebook_id: str) -> Dict[str, Any]:
    db = SessionLocal()

    try:
        notebook = (
            db.query(Notebook)
            .filter(Notebook.notebook_id == notebook_id)
            .first()
        )

        if not notebook:
            raise HTTPException(
                status_code=404,
                detail="Notebook not found."
            )

        documents = (
            db.query(Document)
            .filter(Document.notebook_id == notebook_id)
            .all()
        )

        return {
            "notebook_id": notebook_id,
            "notebook_name": notebook.name,
            "total_documents": len(documents),
            "documents": [
                {
                    "file_id": doc.file_id,
                    "filename": doc.filename,
                    "stored_as": doc.stored_as,
                    "total_pages": doc.total_pages,
                    "total_chunks": doc.total_chunks,
                    "embedding_dimension": doc.embedding_dimension,
                    "status": doc.status,
                    "uploaded_at": doc.uploaded_at
                }
                for doc in documents
            ]
        }

    finally:
        db.close()


# ==================================================
# 3. DELETE ONE PDF (Simplified Endpoint)
# ==================================================
# Added to support frontend calls that only pass file_id

@router.delete("/documents/{file_id}")
def delete_document_simple(file_id: str) -> Dict[str, Any]:
    db = SessionLocal()

    try:
        document = (
            db.query(Document)
            .filter(Document.file_id == file_id)
            .first()
        )

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found."
            )

        notebook_id = document.notebook_id
        filename = document.filename

        # Delete PDF file from storage
        pdf_path = NOTEBOOKS_DIR / str(notebook_id) / "sources" / document.stored_as
        if pdf_path.exists():
            pdf_path.unlink()

        # Load notebook FAISS index and chunks
        index, chunks = load_notebook_faiss(notebook_id)
        if chunks is None:
            chunks = []

        # Remove chunks belonging to this PDF (Safely handling strings/dicts)
        remaining_chunks = []
        for chunk in chunks:
            if isinstance(chunk, dict):
                if chunk.get("file_id") != file_id:
                    remaining_chunks.append(chunk)
            else:
                remaining_chunks.append(chunk)

        # Rebuild FAISS index if chunks remain
        if remaining_chunks:
            texts_to_embed = []
            for chunk in remaining_chunks:
                if isinstance(chunk, dict):
                    texts_to_embed.append(chunk.get("text", ""))
                else:
                    texts_to_embed.append(str(chunk))
                    
            embeddings = generate_embeddings(texts_to_embed)
            new_index = create_faiss_index(embeddings)
            save_notebook_faiss(new_index, remaining_chunks, notebook_id)
            remaining_vectors = new_index.ntotal
        else:
            faiss_dir = NOTEBOOKS_DIR / str(notebook_id) / "faiss"
            index_path = faiss_dir / "index.faiss"
            metadata_path = faiss_dir / "metadata.pkl"

            if index_path.exists():
                index_path.unlink()
            if metadata_path.exists():
                metadata_path.unlink()

            remaining_vectors = 0

        db.delete(document)
        db.commit()

        return {
            "message": "Document deleted successfully",
            "file_id": file_id,
            "filename": filename,
            "remaining_faiss_vectors": remaining_vectors
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")
    finally:
        db.close()


# ==================================================
# 4. DELETE ONE PDF FROM A NOTEBOOK (Original Endpoint)
# ==================================================

@router.delete("/notebooks/{notebook_id}/documents/{file_id}")
def delete_document(notebook_id: str, file_id: str) -> Dict[str, Any]:
    db = SessionLocal()

    try:
        notebook = (
            db.query(Notebook)
            .filter(Notebook.notebook_id == notebook_id)
            .first()
        )

        if not notebook:
            raise HTTPException(
                status_code=404,
                detail="Notebook not found."
            )

        document = (
            db.query(Document)
            .filter(
                Document.file_id == file_id,
                Document.notebook_id == notebook_id
            )
            .first()
        )

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found in this notebook."
            )

        filename = document.filename

        # ------------------------------------------
        # Delete PDF file from storage
        # ------------------------------------------
        pdf_path = (
            NOTEBOOKS_DIR
            / str(notebook_id)
            / "sources"
            / document.stored_as
        )

        if pdf_path.exists():
            pdf_path.unlink()

        # ------------------------------------------
        # Load notebook FAISS index and chunks
        # ------------------------------------------
        index, chunks = load_notebook_faiss(notebook_id)
        
        # Ensure chunks is a list to prevent TypeError during iteration
        if chunks is None:
            chunks = []

        # ------------------------------------------
        # Remove chunks belonging to this PDF
        # ------------------------------------------
        # FIX: Safely handle chunks that might be raw strings or dicts
        remaining_chunks = []
        for chunk in chunks:
            if isinstance(chunk, dict):
                if chunk.get("file_id") != file_id:
                    remaining_chunks.append(chunk)
            else:
                # If it's a raw string or malformed, we keep it to be safe
                remaining_chunks.append(chunk)

        # ------------------------------------------
        # Rebuild FAISS index if chunks remain
        # ------------------------------------------
        if remaining_chunks:
            # Extract text strings from chunk dictionaries for embedding
            texts_to_embed = []
            for chunk in remaining_chunks:
                if isinstance(chunk, dict):
                    texts_to_embed.append(chunk.get("text", ""))
                else:
                    texts_to_embed.append(str(chunk))
                    
            embeddings = generate_embeddings(texts_to_embed)
            
            new_index = create_faiss_index(embeddings)
            save_notebook_faiss(new_index, remaining_chunks, notebook_id)
            remaining_vectors = new_index.ntotal
        else:
            # --------------------------------------
            # No documents/chunks remain, clean up FAISS files
            # --------------------------------------
            faiss_dir = NOTEBOOKS_DIR / str(notebook_id) / "faiss"
            index_path = faiss_dir / "index.faiss"
            metadata_path = faiss_dir / "metadata.pkl"

            if index_path.exists():
                index_path.unlink()
            if metadata_path.exists():
                metadata_path.unlink()

            remaining_vectors = 0

        # ------------------------------------------
        # Delete database record
        # ------------------------------------------
        db.delete(document)
        db.commit()

        return {
            "message": "Document deleted successfully",
            "notebook_id": notebook_id,
            "file_id": file_id,
            "filename": filename,
            "remaining_faiss_vectors": remaining_vectors
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )

    finally:
        db.close()