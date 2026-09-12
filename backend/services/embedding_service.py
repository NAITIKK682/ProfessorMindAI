from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

# Load the embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_embeddings(chunks):
    """
    Generates embeddings for a list of text chunks.
    Safely handles both lists of dictionaries (from PDF upload) 
    and lists of raw strings (from chat queries).
    """
    
    # Normalize input to safely extract text
    texts = []
    for chunk in chunks:
        if isinstance(chunk, dict):
            # If it's a dictionary, extract the 'text' key safely
            text = chunk.get("text", "")
        else:
            # If it's a raw string (like a chat query), use it directly
            text = str(chunk)
            
        # Only add non-empty strings to prevent encoding errors
        if text and str(text).strip():
            texts.append(str(text).strip())
    
    # If no valid text is found, return an empty list
    if not texts:
        logger.warning("No valid text found to generate embeddings.")
        return []

    try:
        # Generate embeddings
        embeddings = model.encode(
            texts,
            convert_to_numpy=True
        )
        
        # Return as a standard Python list of lists for consistency across the app
        return embeddings.tolist()
        
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {str(e)}", exc_info=True)
        raise RuntimeError(f"Embedding generation failed: {str(e)}") from e