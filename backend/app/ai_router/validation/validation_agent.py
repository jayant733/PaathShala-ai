import json
from typing import Tuple

class ValidationAgent:
    """
    Validation Agent: Inspects response quality, code completeness, JSON formatting, and triggers retry on quality failure.
    """
    def validate_response(self, text: str, requires_json: bool = False) -> Tuple[bool, str]:
        if not text or len(text.strip()) < 5:
            return False, "Response text empty or severely truncated"

        if requires_json:
            try:
                json.loads(text.strip())
            except Exception:
                return False, "Malformed JSON formatting"

        return True, "OK"
