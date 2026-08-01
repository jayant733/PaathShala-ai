from dataclasses import dataclass

@dataclass
class IntentResult:
    primary_intent: str # "coding", "math", "reasoning", "creative", "summarization", "conversation"
    confidence: float
    detected_language: str # "python", "java", "cpp", "general"

CODE_KEYWORDS = ["def ", "class ", "function", "import ", "code", "script", "sql", "java", "python", "typescript", "c++", "dsa"]
MATH_KEYWORDS = ["calculate", "equation", "solve", "math", "integral", "derivative", "matrix"]
REASONING_KEYWORDS = ["why", "explain", "compare", "proof", "logical", "analyze"]
CREATIVE_KEYWORDS = ["write a poem", "story", "creative", "essay", "dialogue"]

class IntentClassifierAgent:
    """
    Classifies prompt intent into Coding, Math, Reasoning, Creative, Conversation.
    """
    def classify(self, prompt: str) -> IntentResult:
        p_lower = prompt.lower()
        
        code_score = sum(1 for kw in CODE_KEYWORDS if kw in p_lower)
        math_score = sum(1 for kw in MATH_KEYWORDS if kw in p_lower)
        reasoning_score = sum(1 for kw in REASONING_KEYWORDS if kw in p_lower)
        creative_score = sum(1 for kw in CREATIVE_KEYWORDS if kw in p_lower)

        language = "general"
        if "python" in p_lower: language = "python"
        elif "java" in p_lower: language = "java"
        elif "c++" in p_lower or "cpp" in p_lower: language = "cpp"

        scores = {
            "coding": code_score * 2.0,
            "math": math_score * 2.0,
            "reasoning": reasoning_score * 1.5,
            "creative": creative_score * 2.0,
        }

        best_intent = max(scores, key=scores.get)
        if scores[best_intent] == 0:
            return IntentResult(primary_intent="conversation", confidence=0.8, detected_language="general")

        return IntentResult(
            primary_intent=best_intent,
            confidence=min(0.98, 0.6 + (scores[best_intent] * 0.1)),
            detected_language=language
        )
