import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient
from app.main import app
from app.api.dependencies import get_current_user
from app.database.models.user import User
import uuid
import datetime

pytestmark = pytest.mark.asyncio

async def mock_get_current_user():
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="mocked",
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )

app.dependency_overrides[get_current_user] = mock_get_current_user

@patch("app.services.agent_service.AgentService.chat", new_callable=AsyncMock)
async def test_agent_chat_endpoint(mock_chat):
    mock_chat.return_value = {
        "agent": "planner",
        "response": "Here is your learning roadmap: Week 1...",
        "conversation_id": uuid.uuid4()
    }

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/agent/chat", json={"message": "Create my AI learning roadmap"})
        
    assert response.status_code == 200
    data = response.json()
    assert data["agent"] == "planner"
    assert "Here is your learning roadmap" in data["response"]
    assert "conversation_id" in data

@patch("app.services.ai_service.AIService.chat_with_tutor", new_callable=AsyncMock)
async def test_supervisor_routing(mock_ai_chat):
    # Mock the supervisor deciding to use the tutor
    mock_ai_chat.return_value = {
        "response_text": '{"next_agent": "tutor"}',
        "model_name": "mocked",
        "token_usage": {"input": 1, "output": 1}
    }
    
    from app.ai.agents.supervisor import create_supervisor_node
    # Pass a dummy AI Service
    supervisor_node = create_supervisor_node(MagicMock())
    
    result = await supervisor_node({"user_message": "Explain neural networks", "user_id": uuid.uuid4()})
    assert result["next_agent"] == "tutor"

@patch("app.services.ai_service.AIService.chat_with_tutor", new_callable=AsyncMock)
async def test_planner_routing(mock_ai_chat):
    # Mock the supervisor deciding to use the planner
    mock_ai_chat.return_value = {
        "response_text": '{"next_agent": "planner"}',
        "model_name": "mocked",
        "token_usage": {"input": 1, "output": 1}
    }
    
    from app.ai.agents.supervisor import create_supervisor_node
    supervisor_node = create_supervisor_node(MagicMock())
    
    result = await supervisor_node({"user_message": "Make me a roadmap", "user_id": uuid.uuid4()})
    assert result["next_agent"] == "planner"
