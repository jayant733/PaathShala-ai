import pytest
from unittest.mock import patch, AsyncMock
from uuid import uuid4
from app.services.memory_service import MemoryService
from app.repositories.memory_repository import MemoryRepository

pytestmark = pytest.mark.asyncio

@patch("app.ai.embeddings.embedding_provider.EmbeddingProvider.create_embedding", new_callable=AsyncMock)
@patch("app.services.ai_service.AIService.chat_with_tutor", new_callable=AsyncMock)
async def test_extract_and_save_memory(mock_ai_chat, mock_embed):
    # Mock LLM JSON response for memory extraction
    mock_ai_chat.return_value = {
        "response_text": '''
        {
          "memories": [
            {
              "type": "profile",
              "content": "User wants to be an ML Engineer",
              "importance_score": 8.5
            }
          ],
          "learning_events": [
            {
              "topic": "Neural Networks",
              "event_type": "struggled",
              "description": "Had trouble with backpropagation"
            }
          ]
        }
        ''',
        "model_name": "mocked",
        "token_usage": {"input": 10, "output": 10}
    }
    
    mock_embed.return_value = [0.1] * 768
    
    mock_repo = AsyncMock(spec=MemoryRepository)
    
    # Initialize MemoryService with mocked components
    from app.services.ai_service import AIService
    from app.ai.embeddings.embedding_provider import EmbeddingProvider
    
    service = MemoryService(
        ai_service=AsyncMock(spec=AIService),
        embedder=AsyncMock(spec=EmbeddingProvider),
        repository=mock_repo
    )
    
    # Run extraction
    await service.extract_and_save_memory(uuid4(), "Explain backprop", "It's hard.")
    
    # Verify save_memory was called
    assert mock_repo.save_memory.called
    args, kwargs = mock_repo.save_memory.call_args
    assert kwargs["memory_type"] == "profile"
    assert kwargs["content"] == "User wants to be an ML Engineer"
    
    # Verify save_learning_event was called
    assert mock_repo.save_learning_event.called
    args, kwargs = mock_repo.save_learning_event.call_args
    assert kwargs["topic"] == "Neural Networks"
    assert kwargs["event_type"] == "struggled"
