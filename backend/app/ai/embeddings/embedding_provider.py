from abc import ABC, abstractmethod
from typing import List

class EmbeddingProvider(ABC):
    @abstractmethod
    async def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        Returns a list of vectors (list of floats).
        """
        pass
    
    @abstractmethod
    async def create_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        """
        pass
