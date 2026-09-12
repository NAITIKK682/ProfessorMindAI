import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict

from backend.services.rag_service import answer_question
from backend.database import SessionLocal
from backend.models.notebook import Notebook

# Configure logger for this module
logger = logging.getLogger(__name__)

router = APIRouter()


class QuestionRequest(BaseModel):
    notebook_id: str = Field(..., description="The ID of the notebook to query")
    question: str = Field(..., min_length=1, max_length=2000, description="The student's question")
    top_k: int = Field(default=8, ge=1, le=50, description="Number of top chunks to retrieve")


@router.post("/ask")
async def ask_question(request: QuestionRequest) -> Dict[str, Any]:
    """
    Processes a student's question using the RAG pipeline for a specific notebook.
    """

    # ------------------------------------------
    # 1. Verify notebook exists
    # ------------------------------------------
    
    db = SessionLocal()
    try:
        notebook = (
            db.query(Notebook)
            .filter(Notebook.notebook_id == request.notebook_id)
            .first()
        )
        
        if not notebook:
            logger.warning(f"Notebook not found: {request.notebook_id}")
            raise HTTPException(
                status_code=404,
                detail="Notebook not found."
            )
    finally:
        db.close()

    # ------------------------------------------
    # 2. Process question using RAG
    # ------------------------------------------

    try:
        logger.info(f"Processing RAG query for notebook: {request.notebook_id}")
        
        result = answer_question(
            query=request.question,
            notebook_id=request.notebook_id,
            top_k=request.top_k
        )

        return result

    except FileNotFoundError:
        logger.error(f"FAISS index not found for notebook: {request.notebook_id}")
        raise HTTPException(
            status_code=404,
            detail="FAISS index for this notebook was not found. Please upload documents first."
        )

    except ValueError as e:
        logger.warning(f"Invalid request for notebook {request.notebook_id}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        # Log the full traceback for debugging, but return a generic message to the client
        # to prevent leaking sensitive system information (Security Best Practice)
        logger.error(f"Unexpected error processing question for notebook {request.notebook_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your question. Please try again."
        )