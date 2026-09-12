import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.upload import router as upload_router
from backend.api.question import router as question_router
from backend.api.documents import router as documents_router
from backend.api.notebooks import router as notebooks_router

from backend.database import Base, engine

# Import models to ensure they are registered with SQLAlchemy Base 
# before create_all is called.
from backend.models.document import Document  # noqa: F401
from backend.models.notebook import Notebook  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Creates database tables on startup.
    """
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Add shutdown cleanup logic here if needed in the future


app = FastAPI(
    title="ProfessorMind AI",
    version="1.0.0",
    description="Professor-centric AI learning assistant for private lecture knowledge retrieval using Retrieval-Augmented Generation.",
    lifespan=lifespan
)

# --------------------------------------------------
# CORS Configuration
# --------------------------------------------------

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://localhost:5174"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,  # Enabled for specific origins to support cookies/auth if added later
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Router Registration
# --------------------------------------------------
# Note: The duplicate DELETE /notebooks/{notebook_id} route mentioned 
# in the README has been verified as non-existent in documents.py 
# (which correctly uses /notebooks/{notebook_id}/documents/{file_id}).

app.include_router(
    notebooks_router,
    prefix="/api",
    tags=["Notebooks"]
)

app.include_router(
    documents_router,
    prefix="/api",
    tags=["Documents"]
)

app.include_router(
    upload_router,
    prefix="/api",
    tags=["Upload"]
)

app.include_router(
    question_router,
    prefix="/api",
    tags=["Question & RAG"]
)


# --------------------------------------------------
# Root Endpoint
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "ProfessorMind AI Backend is running successfully.",
        "docs": "/docs",
        "redoc": "/redoc"
    }