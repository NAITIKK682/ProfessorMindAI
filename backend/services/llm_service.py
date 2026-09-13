import ollama
import logging
import time
import re

logger = logging.getLogger(__name__)


def generate_answer(
    query: str,
    context: str
) -> str:
    """
    Generate a grounded academic answer using ONLY the retrieved
    lecture material.

    Important design rule:
    - The LLM generates the academic answer.
    - Source filename/page references are handled by the backend.
    - The LLM must NOT invent page numbers or source citations.
    """

    start_time = time.time()

    # ---------------------------------
    # Analyze query
    # ---------------------------------

    query_length = len(
        query.split()
    )

    is_explanation = (
        "explain" in query.lower()
        or "describe" in query.lower()
    )

    is_multi_part = (
        "?" in query
        and len(
            re.findall(
                r"\d+\.",
                query
            )
        ) > 1
    )

    # ---------------------------------
    # Response length
    # ---------------------------------

    max_tokens = 768

    if is_explanation or is_multi_part:
        max_tokens = 1200

    elif query_length > 20:
        max_tokens = 900

    # ---------------------------------
    # Grounded academic prompt
    # ---------------------------------

    prompt = f"""
You are ProfessorMind AI, a rigorous academic assistant.

Your task is to answer the student's question using ONLY the
retrieved lecture material provided below.

========================
STRICT GROUNDING RULES
========================

1. Use only information present in the provided lecture material.

2. Do NOT use outside knowledge, assumptions, guesses, or invented facts.

3. Do NOT invent examples, formulas, definitions, figures, values,
   terminology, or explanations that are not supported by the material.

4. Do NOT generate page numbers.

5. Do NOT generate source citations such as:
   (Page X)
   [Page X]
   Page X
   Source X
   or similar page references.

6. Do NOT calculate, guess, infer, or modify page numbers.

7. Do NOT invent figure numbers such as Figure 9U unless that exact
   figure reference is clearly present in the retrieved material.

8. Source filename and page references are handled separately by the
   ProfessorMind AI backend. Your responsibility is ONLY to generate
   the answer.

    9. If the retrieved material does not contain enough information to
   answer the question, reply exactly:
   "The uploaded notes do not provide enough information to answer this question."

10. Stay faithful to the terminology and meaning of the lecture notes.

========================
ACADEMIC RESPONSE STYLE
========================

For definitions:
- Start with a clear definition.

For explanations:
- Explain the concept step by step.
- Include relevant components and working.

For processes:
- Use numbered steps.

For formulas:
- Preserve formulas exactly as they appear in the material.

For comparisons:
- Use a table when useful.

For examples:
- Include only examples supported by the lecture material.

For multi-part questions:
- Answer each part separately and in order.

Use readable Markdown.

Do not add unnecessary introductions such as:
"According to the lecture notes..."
"Based on the provided material..."
"As mentioned in the lecture..."

========================
RETRIEVED LECTURE MATERIAL
========================

{context}

========================
STUDENT QUESTION
========================

{query}

========================
ANSWER
========================
"""

    try:

        llm_start = time.time()

        response = ollama.chat(
            model="llama3.2",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            options={
                "temperature": 0.05,
                "num_predict": max_tokens,
                "num_ctx": 4096,
                "seed": 42,
                "num_gpu_layers": -1,
                "num_threads": 4,
                "repeat_penalty": 1.1
            },

            stream=False
        )

        # ---------------------------------
        # Extract response content
        # ---------------------------------

        content = ""

        if isinstance(response, dict):

            message = response.get(
                "message",
                {}
            )

            if isinstance(message, dict):

                content = message.get(
                    "content",
                    ""
                )

            else:

                content = getattr(
                    message,
                    "content",
                    ""
                )

        else:

            message = getattr(
                response,
                "message",
                {}
            )

            if isinstance(message, dict):

                content = message.get(
                    "content",
                    ""
                )

            else:

                content = getattr(
                    message,
                    "content",
                    ""
                )

        # ---------------------------------
        # Process answer
        # ---------------------------------

        if isinstance(content, str):

            content = content.strip()

            if content:

                # Remove accidental citation syntax if the model still produces it.
                content = _remove_generated_source_references(
                    content
                )

                # Academic formatting
                try:

                    processed = (
                        _enhance_academic_formatting(
                            content
                        )
                    )

                except Exception as e:

                    logger.error(
                        "Academic formatting failed: %s",
                        str(e),
                        exc_info=True
                    )

                    processed = content

                # ---------------------------------
                # Performance logging
                # ---------------------------------

                duration = (
                    time.time()
                    - start_time
                )

                llm_duration = (
                    time.time()
                    - llm_start
                )

                logger.info(
                    "Academic response generated in "
                    "%.2fs (total: %.2fs) | "
                    "Max tokens: %s | Query length: %s",
                    llm_duration,
                    duration,
                    max_tokens,
                    query_length
                )

                return processed

        # ---------------------------------
        # Empty response fallback
        # ---------------------------------

        logger.warning(
            "Empty academic response from Llama"
        )

        return (
            "I couldn't find a complete answer in the "
            "uploaded lecture material. Please rephrase "
            "your question or ask about a specific concept "
            "from the uploaded notes."
        )

    except Exception as e:

        duration = (
            time.time()
            - start_time
        )

        logger.error(
            "Academic response generation failed "
            "after %.2fs: %s",
            duration,
            str(e),
            exc_info=True
        )

        error_msg = str(e).lower()

        if (
            "context" in error_msg
            or "window" in error_msg
        ):

            return (
                "The retrieved lecture material is too large "
                "for this question. Please ask about a more "
                "specific concept."
            )

        if "timeout" in error_msg:

            return (
                "Processing this question is taking longer "
                "than expected. Please try a more specific "
                "question."
            )

        return (
            "I encountered an issue while processing your "
            "question. Please try again."
        )


# =========================================================
# REMOVE GENERATED SOURCE REFERENCES
# =========================================================

def _remove_generated_source_references(
    content: str
) -> str:
    """
    Safety layer.

    The prompt already tells Llama not to generate page
    references. This function removes common accidental
    page/source references if the model still generates them.

    Backend source metadata remains authoritative.
    """

    # Examples:
    # (Page 9)
    # (Page 12)
    # [Page 9]
    # [Page 12]
    content = re.sub(
        r"\(\s*Page\s+\d+(?:\s*[-–]\s*\d+)?\s*\)",
        "",
        content,
        flags=re.IGNORECASE
    )

    content = re.sub(
        r"\[\s*Page\s+\d+(?:\s*[-–]\s*\d+)?\s*\]",
        "",
        content,
        flags=re.IGNORECASE
    )

    # Clean excessive spaces created by removal
    content = re.sub(
        r"[ \t]{2,}",
        " ",
        content
    )

    content = re.sub(
        r"\n{3,}",
        "\n\n",
        content
    )

    # A stray standalone SVG label is an output artifact, not lecture content.
    content = re.sub(r"(?im)^\s*svg\s*$\n?", "", content)

    return content.strip()


# =========================================================
# ACADEMIC FORMATTING
# =========================================================

def _enhance_academic_formatting(
    content: str
) -> str:
    """
    Apply lightweight Markdown formatting without changing
    the meaning of the LLM response.
    """

    try:

        # ---------------------------------
        # Remove redundant introductory phrases
        # ---------------------------------

        redundant_phrases = [
            "According to the lecture notes,",
            "Based on the provided material,",
            "As mentioned in the lecture,",
            "The lecture notes state that"
        ]

        for phrase in redundant_phrases:

            content = content.replace(
                phrase,
                ""
            )

        # ---------------------------------
        # Normalize bullet points
        # ---------------------------------

        content = re.sub(
            r"^[ \t]*[-•]\s+",
            "- ",
            content,
            flags=re.MULTILINE
        )

        # ---------------------------------
        # Normalize numbered lists
        # ---------------------------------

        content = re.sub(
            r"^[ \t]*(\d+)\.\s+",
            r"\1. ",
            content,
            flags=re.MULTILINE
        )

        # ---------------------------------
        # Remove accidental source labels
        # ---------------------------------

        content = re.sub(
            r"^\s*(Source|Sources)\s*:\s*$",
            "",
            content,
            flags=re.IGNORECASE | re.MULTILINE
        )

        # ---------------------------------
        # Normalize excessive blank lines
        # ---------------------------------

        content = re.sub(
            r"\n{3,}",
            "\n\n",
            content
        )

        return content.strip()

    except Exception as e:

        logger.error(
            "Error in academic formatting: %s",
            str(e),
            exc_info=True
        )

        return content


# =========================================================
# RESPONSE TIME ESTIMATION
# =========================================================

def estimate_response_time(
    query: str,
    context: str
) -> float:
    """
    Estimate approximate response processing time.
    """

    try:

        query_length = len(
            query.split()
        )

        context_length = len(
            context.split()
        )

        return max(
            2.5,
            2.5
            + (query_length * 0.12)
            + (context_length * 0.006)
        )

    except Exception as e:

        logger.error(
            "Error estimating response time: %s",
            str(e),
            exc_info=True
        )

        return 5.0