import ollama
import logging

logger = logging.getLogger(__name__)

def generate_answer(query: str, context: str) -> str:

    # Optimized prompt - shorter and faster
    prompt = f"""You are ProfessorMind AI, an academic assistant. Answer using ONLY the provided lecture material.

**RULES:**
- Use ONLY information from the lecture notes below
- Do NOT use outside knowledge or general information
- If the answer is not in the notes, say: "This question is outside the scope of the uploaded notes."
- Combine information from all relevant chunks
- Follow the PDF page sequence
- Preserve definitions, formulas, examples exactly as written
- Use markdown formatting (headings, bullets, numbered lists)
- Be complete but remove duplicates
- Add page references like (Page X) when helpful

**LECTURE MATERIAL:**
{context}

**STUDENT QUESTION:**
{query}

**ANSWER:**
"""

    try:
        response = ollama.chat(
            model="llama3.2",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            options={
                "temperature": 0.1,  # Slightly higher for better fluency
                "num_predict": 1024  # Limit response length for speed
            },
            stream=False  # Disable streaming for simpler handling
        )

        # PROPERLY extract content - this fixes the raw output issue
        if isinstance(response, dict):
            message = response.get("message", {})
            if isinstance(message, dict):
                content = message.get("content", "")
                if isinstance(content, str):
                    return content.strip()
        
        # Fallback
        return "Sorry, I couldn't generate a response."

    except Exception as e:
        logger.error(f"LLM generation failed: {str(e)}", exc_info=True)
        raise RuntimeError(f"Failed to generate answer: {str(e)}") from e