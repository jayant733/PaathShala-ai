import google.generativeai as genai
from typing import List
from app.core.config import settings
from app.ai.embeddings.embedding_provider import EmbeddingProvider

class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = "models/gemini-embedding-2"

    async def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        # Using synchronous embed_content for simplicity in this implementation, 
        # normally you might use an async client or run in threadpool
        response = genai.embed_content(
            model=self.model_name,
            content=texts,
            task_type="retrieval_document",
            output_dimensionality=768
        )
        return response['embedding']

    async def create_embedding(self, text: str) -> List[float]:
        response = genai.embed_content(
            model=self.model_name,
            content=text,
            task_type="retrieval_query",
            output_dimensionality=768
        )
        return response['embedding']
