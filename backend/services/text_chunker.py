from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_text(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Splits extracted PDF pages into smaller overlapping text chunks.
    
    Args:
        pages: A list of dictionaries, each containing 'text' and 'page_number'.
        
    Returns:
        A list of chunk dictionaries with 'chunk_index', 'page_number', 
        'page_chunk_index', and 'text'.
    """

    if not pages:
        return []

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = []

    chunk_index = 0

    for page in pages:

        # ------------------------------------------
        # Safely extract text and page number
        # ------------------------------------------
        
        page_text = page.get("text", "")
        page_number = page.get("page_number", 1)

        # Ensure text is a string
        if not isinstance(page_text, str):
            page_text = str(page_text)

        # Skip empty pages to prevent unnecessary processing
        if not page_text.strip():
            continue

        page_chunks = text_splitter.split_text(
            page_text
        )

        for page_chunk_index, chunk in enumerate(page_chunks):

            chunks.append({
                "chunk_index": chunk_index,
                "page_number": page_number,
                "page_chunk_index": page_chunk_index,
                "text": chunk
            })

            chunk_index += 1

    return chunks