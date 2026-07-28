import fitz  # PyMuPDF
from fastapi import HTTPException, status
import logging

logger = logging.getLogger("paathshala")

class DocumentProcessor:
    def extract_text(self, file_path: str, file_type: str) -> str:
        """
        Extract text from a file based on its type.
        """
        try:
            if file_type == "application/pdf":
                return self._extract_from_pdf(file_path)
            elif file_type in ["text/plain", "text/markdown"]:
                return self._extract_from_text(file_path)
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported file type: {file_type}")
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to extract text from document")

    def _extract_from_pdf(self, file_path: str) -> str:
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text() + "\n"
        return text

    def _extract_from_text(self, file_path: str) -> str:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
