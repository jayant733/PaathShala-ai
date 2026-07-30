import httpx
from typing import List, Dict, Any

from app.core.config import settings

class LocalModelService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        
    async def is_running(self) -> bool:
        """Check if Ollama is running."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(self.base_url)
                return response.status_code == 200
        except Exception:
            return False
            
    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Fetch installed models from Ollama."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    models = []
                    for model in data.get("models", []):
                        models.append({
                            "name": model.get("name"),
                            "type": "local",
                            "available": True
                        })
                    return models
                return []
        except Exception:
            return []
