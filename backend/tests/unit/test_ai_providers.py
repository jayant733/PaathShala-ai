import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.ai.providers import ProviderManager, LocalModelService, GeminiProvider, OllamaProvider

@pytest.fixture
def mock_settings():
    with patch("app.ai.providers.provider_manager.settings") as mock:
        mock.DEFAULT_AI_PROVIDER = "gemini"
        mock.OLLAMA_ENABLED = True
        mock.GEMINI_ENABLED = True
        yield mock

@pytest.mark.asyncio
async def test_ollama_detection():
    service = LocalModelService()
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "models": [
            {"name": "llama3.1"},
            {"name": "qwen2.5"}
        ]
    }
    
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        models = await service.get_available_models()
        assert len(models) == 2
        assert models[0]["name"] == "llama3.1"
        assert models[1]["name"] == "qwen2.5"

@pytest.mark.asyncio
async def test_gemini_provider_generate(mock_settings):
    provider = GeminiProvider()
    with patch("google.generativeai.GenerativeModel.generate_content_async", new_callable=AsyncMock) as mock_generate:
        mock_response = MagicMock()
        mock_response.text = "Hello from Gemini"
        mock_response.usage_metadata.prompt_token_count = 10
        mock_response.usage_metadata.candidates_token_count = 20
        mock_generate.return_value = mock_response
        
        result = await provider.generate_response("Hi")
        assert result["response_text"] == "Hello from Gemini"
        assert result["token_usage"]["input"] == 10

@pytest.mark.asyncio
async def test_provider_manager_fallback(mock_settings):
    manager = ProviderManager()
    
    # Mock primary (gemini) failing
    with patch.object(manager.gemini, "generate_response", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.side_effect = Exception("Gemini down")
        
        # Mock ollama healthy
        with patch.object(manager.ollama, "check_health", new_callable=AsyncMock) as mock_health:
            mock_health.return_value = True
            
            # Mock ollama responding
            with patch.object(manager.ollama, "generate_response", new_callable=AsyncMock) as mock_ollama:
                mock_ollama.return_value = {"response_text": "Hello from Ollama"}
                
                result = await manager.generate_response("Hi")
                assert result["response_text"] == "Hello from Ollama"
                mock_gemini.assert_called_once()
                mock_ollama.assert_called_once()
