from typing import List, Optional

class ContextWindowCalculator:
    """
    Computes exact context size across System Prompt + User Query + Files + History.
    Filters out models with insufficient context windows.
    """
    def calculate_total_tokens(
        self,
        user_prompt: str,
        system_instruction: Optional[str] = None,
        file_content: Optional[str] = None,
        chat_history: Optional[List[dict]] = None
    ) -> int:
        total_chars = len(user_prompt)
        if system_instruction: total_chars += len(system_instruction)
        if file_content: total_chars += len(file_content)
        if chat_history:
            for msg in chat_history:
                total_chars += len(msg.get("content", ""))

        # Rule of thumb: ~4 characters per token
        return max(1, total_chars // 4)
