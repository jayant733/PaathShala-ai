class PromptComplexityAgent:
    """
    Categorizes prompt difficulty into Easy, Medium, Hard, Expert.
    """
    def analyze_complexity(self, prompt: str) -> str:
        length = len(prompt)
        p_lower = prompt.lower()

        is_complex = any(word in p_lower for word in ["distributed", "architecture", "algorithm", "concurrent", "system design", "optimum", "proof"])

        if length < 60 and not is_complex:
            return "Easy"
        elif length < 250 and not is_complex:
            return "Medium"
        elif length < 1000 or is_complex:
            return "Hard"
        else:
            return "Expert"
