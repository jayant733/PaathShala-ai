from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseMetadataProvider(ABC):
    @abstractmethod
    async def extract_capabilities(self, model_name: str) -> Dict[str, Any]:
        """Extract capability ratings and features for a given model."""
        pass
