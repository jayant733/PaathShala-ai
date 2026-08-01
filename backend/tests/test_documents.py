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

@patch("app.services.document_service.DocumentService.upload_and_process_document", new_callable=AsyncMock)
async def test_upload_document(mock_upload):
    # Mock the return value
    mock_upload.return_value = MagicMock(
        id=uuid.uuid4(),
        filename="test.txt",
        file_type="text/plain",
        status="completed",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )

    async with AsyncClient(app=app, base_url="http://test") as ac:
        files = {"file": ("test.txt", b"Hello world", "text/plain")}
        response = await ac.post("/api/v1/documents/upload", files=files)
        
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["status"] == "completed"
    assert "id" in data

@patch("app.services.document_service.DocumentService.get_document_by_id", new_callable=AsyncMock)
@patch("app.services.rag_service.RAGService.ask_question", new_callable=AsyncMock)
async def test_ask_question(mock_ask, mock_get_doc):
    doc_id = uuid.uuid4()
    mock_get_doc.return_value = MagicMock(id=doc_id)
    
    mock_ask.return_value = MagicMock(
        answer="This is a mock answer based on context.",
        sources=[]
    )
    # The BaseModel needs to be mockable or dict
    mock_ask.return_value.model_dump.return_value = {
        "answer": "This is a mock answer based on context.",
        "sources": []
    }

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(f"/api/v1/documents/{str(doc_id)}/ask", json={"question": "What is life?"})
        
    assert response.status_code == 200
