import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from app.main import app

# Mock user dependency to bypass authentication for AI test
from app.api.dependencies import get_current_user
from app.database.models.user import User
import uuid
import datetime

async def mock_get_current_user():
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="mocked",
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    return user

app.dependency_overrides[get_current_user] = mock_get_current_user

# Setup pytest-asyncio
pytestmark = pytest.mark.asyncio

@patch("app.ai.llm.gemini.genai.GenerativeModel")
async def test_ai_chat_endpoint(mock_model):
    # Mock the generative model instance and its generate_content_async method
    mock_instance = AsyncMock()
    mock_model.return_value = mock_instance
    
    mock_response = AsyncMock()
    mock_response.text = "This is a mocked explanation of neural networks."
    mock_response.usage_metadata.prompt_token_count = 10
    mock_response.usage_metadata.candidates_token_count = 20
    
    mock_instance.generate_content_async.return_value = mock_response

    # Need to mock the repository to avoid actual DB insertion
    with patch("app.services.ai_service.AIRepository.save_interaction", new_callable=AsyncMock) as mock_save:
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.post("/api/v1/ai/chat", json={"message": "Explain neural networks"})
            
        assert response.status_code == 200
        data = response.json()
        assert data["response"] == "This is a mocked explanation of neural networks."
        assert data["model"] == "gemini-2.5-flash"
        assert data["tokens"]["input"] == 10
        assert data["tokens"]["output"] == 20
        
        # Verify db save was called
        mock_save.assert_called_once()
