"""Prompt templates for AI quiz generation, validation repair, and from-history generation.

The system prompt enforces a strict JSON contract (see ``QuizDraft`` in
``app/schemas/quiz.py``) so the response can be parsed deterministically.
"""

from typing import Optional

QUIZ_GENERATION_SYSTEM_PROMPT = """You are an expert quiz author for PaathShala AI. You create high-quality,
pedagogically sound quizzes that help learners master a topic.

CRITICAL RULES:
1. Respond with ONLY a single valid JSON object. No markdown fences, no commentary, no trailing text.
2. Every question must be self-contained and answerable from the question itself.
3. Explanations must teach — a short, accurate reason for the correct answer.
4. Correct answers MUST be exact members of the options list (case-insensitive) for choice questions.
5. For "true_false" questions use options ["True", "False"] and correct_answers ["True"] or ["False"].
6. For "short_answer" questions, correct_answers is a list of 1-3 acceptable answers (case-insensitive, trimmed).
7. For "multiple" questions, correct_answers is a list of ALL correct options (set-equality grading).
8. Options must be distinct and meaningful; avoid "all of the above" / "none of the above".
9. Question text must be at least 10 characters and clearly worded.

Return JSON in EXACTLY this shape:
{
  "title": "Short, descriptive quiz title",
  "description": "One-line summary of what the quiz covers",
  "subject": "Subject area, e.g. Computer Science",
  "difficulty": "easy" | "medium" | "hard",
  "duration_minutes": <integer, e.g. 10>,
  "number_of_questions": <integer matching the number of questions>,
  "questions": [
    {
      "question_text": "The full question text",
      "question_type": "MCQ" | "multiple" | "true_false" | "short_answer",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answers": ["Option B"],
      "explanation": "Why this is correct",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "A focused topic tag, e.g. Spring Boot Annotations",
      "points": 1
    }
  ]
}
"""

TEMPLATE_GUIDES: dict[str, str] = {
    "beginner": (
        "Beginner level: definitional, recall and recognition questions. Straightforward vocabulary, "
        "basic concepts, one clear idea per question."
    ),
    "intermediate": (
        "Intermediate level: application and explanation questions. Ask learners to apply a concept, "
        "predict an outcome, or explain why something works."
    ),
    "advanced": (
        "Advanced level: multi-step reasoning, tricky edge cases, debugging scenarios, and synthesis "
        "across subtopics. Questions should reward deep understanding."
    ),
    "coding": (
        "Coding focus: short code snippets, output prediction, error diagnosis, and best practices. "
        "Prefer concrete code in the question text over abstract theory."
    ),
    "concept": (
        "Concept focus: conceptual understanding, analogies, and true/false statements about core ideas. "
        "Emphasize mental models and connections between ideas."
    ),
}


def _clamp_count(question_count: Optional[int]) -> int:
    if question_count is None:
        return 5
    return max(1, min(question_count, 50))


def build_quiz_generation_prompt(
    topic_prompt: str,
    template: str = "intermediate",
    question_count: Optional[int] = None,
    difficulty: Optional[str] = None,
    subject: Optional[str] = None,
) -> str:
    """Assemble the user prompt for generating a quiz from a free-form topic prompt."""
    count = _clamp_count(question_count)
    guide = TEMPLATE_GUIDES.get(template, TEMPLATE_GUIDES["intermediate"])
    diff = difficulty or ("medium" if template in ("intermediate", "concept") else
                          "easy" if template == "beginner" else "hard" if template == "advanced" else "medium")

    parts = [
        f"Create a {count}-question quiz.",
        f"Style guide ({template}): {guide}",
        f"Target difficulty: {diff}.",
    ]
    if subject:
        parts.append(f"Subject: {subject}.")
    parts.append(
        f"Topic / what to cover:\n{topic_prompt}\n\n"
        "Generate the quiz JSON now — valid JSON only."
    )
    return "\n".join(parts)


def build_quiz_from_source_prompt(
    source_text: str,
    template: str = "intermediate",
    question_count: Optional[int] = None,
    difficulty: Optional[str] = None,
) -> str:
    """Assemble the user prompt for generating a quiz grounded in past AI history."""
    count = _clamp_count(question_count)
    guide = TEMPLATE_GUIDES.get(template, TEMPLATE_GUIDES["intermediate"])
    diff = difficulty or ("medium" if template in ("intermediate", "concept") else
                          "easy" if template == "beginner" else "hard" if template == "advanced" else "medium")

    return (
        f"Below is a past AI learning conversation/interaction. Generate a {count}-question quiz grounded in "
        f"the topics discussed there.\n"
        f"Style guide ({template}): {guide}\n"
        f"Target difficulty: {diff}.\n\n"
        "SOURCE TRANSCRIPT:\n"
        f"{source_text}\n\n"
        "Generate the quiz JSON now — valid JSON only."
    )


def build_quiz_repair_prompt(invalid_json: str, errors: list[str]) -> str:
    """Ask the model to fix a draft that failed deterministic validation."""
    error_lines = "\n".join(f"- {e}" for e in errors)
    return (
        "The following quiz JSON failed validation with these errors:\n"
        f"{error_lines}\n\n"
        "Return the CORRECTED quiz JSON only (same schema as before), with every error fixed. "
        "Do not change question topics or intent. Valid JSON only, no markdown fences.\n\n"
        f"INVALID QUIZ JSON:\n{invalid_json}"
    )
