# PaathShal AI Backend

## Project Overview
PaathShal AI is a production-grade Agentic AI Learning Platform. This backend provides the foundation for uploading resources, generating lessons, tracking progress, and communicating with multi-agent workflows.

## Architecture
The backend is built with:
- **FastAPI**: High-performance async web framework.
- **PostgreSQL + pgvector**: Relational database with vector similarity search capabilities.
- **Redis**: Caching and background task queues (prepared).
- **Clean Architecture**: Separation of concerns into routers (API), core logic, services, and data layers.

## Local Setup
1. Create a virtual environment: `python -m venv venv`
2. Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and fill in your values.
5. Run the app: `uvicorn app.main:app --reload`

## Docker Setup
To run the entire stack (FastAPI, PostgreSQL with pgvector, Redis):
```bash
docker compose up --build
```
The API will be available at `http://localhost:8000`.

## Authentication Flow
PaathShal AI uses JWT (JSON Web Tokens) for secure, stateless authentication.

1. **Registration**: Send a `POST /api/v1/auth/register` with `email`, `username`, and `password`. The system hashes the password using bcrypt, creates a new `User` and an empty `UserProfile`.
2. **Login**: Send a `POST /api/v1/auth/login` (form-data: `username` as email, `password`). The system verifies the credentials and returns an `access_token`.
3. **Protected Routes**: Include the token in the `Authorization` header (`Bearer <token>`) for protected routes like `GET /api/v1/users/me`.

## API Endpoints
- `GET /health` - Check system health
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login to get JWT
- `GET /api/v1/users/me` - Get current authenticated user profile (Requires token)
- `POST /api/v1/documents/upload` - Upload a document (PDF, TXT, MD) and process it into vector chunks.
- `POST /api/v1/documents/{document_id}/ask` - Ask a RAG-based question over a specific uploaded document.
- `POST /api/v1/agent/chat` - Chat with the multi-agent orchestration framework (LangGraph).
- `GET /api/v1/memory` - Retrieve the AI's stored memories about the user's profile and knowledge.

## Architecture Highlights

### Memory & Intelligence System
Phase 6 introduces a 3-layer memory foundation to personalize learning:
1. **Profile Memory**: Long-term facts (e.g., career goals) stored as vectors.
2. **Knowledge Memory**: Topics the user has learned or struggled with.
3. **Conversation Memory**: Short-term chat history.

**Memory Lifecycle**:
1. **Interaction**: User and Tutor chat.
2. **Extraction**: `MemoryService` asynchronously uses Gemini to extract structured JSON memories from the conversation turn.
3. **Storage**: Extracted memories are embedded via `GeminiEmbeddingProvider` and stored in `UserMemory` and `LearningEvent` models.
4. **Retrieval**: Before the next LangGraph execution, `AgentTools.retrieve_user_memory()` semantically searches the DB and injects the context directly into `AgentState`.

### Multi-Agent Framework (LangGraph)
Phase 5 introduces a multi-agent orchestration layer built with **LangGraph**:
- **Supervisor Agent**: Analyzes user requests and routes them to specialized sub-agents.
- **Tutor Agent**: Explains concepts adaptively and utilizes RAG for grounded context.
- **Planner Agent**: Generates structured learning roadmaps based on user goals.
- **Quiz Agent**: Automatically generates MCQs and conceptual practice questions.
- **Research Agent**: (In Development) Scaffolded for external web searches.
This framework decouples intelligence and avoids monolithic prompting.

### AI Architecture
The platform is built with a decoupled AI architecture to avoid provider lock-in:
- **API Route**: Receives requests.
- **AIService**: Orchestrates provider selection, applies prompts (like the core Tutor Prompt), and tracks token usage.
- **LLMProvider Interface**: Abstract base class enforcing a strict generate output.
- **Gemini Implementation**: `GeminiProvider` utilizing the `google-generativeai` SDK, wrapped with custom exceptions for rate-limits, timeouts, and configuration errors.

### RAG Pipeline (Document Understanding)
The document understanding pipeline leverages `pgvector` and Gemini embeddings for Retrieval-Augmented Generation:
1. **Upload Flow**: Users upload a PDF, TXT, or MD file.
2. **Text Extraction**: The `DocumentProcessor` uses PyMuPDF to extract text from PDFs.
3. **Chunking**: `ChunkingService` uses Langchain's RecursiveCharacterTextSplitter to split text contextually.
4. **Embedding**: `EmbeddingProvider` (Gemini) converts chunks into 768-dimensional vectors.
5. **Storage**: Vectors and metadata are stored in the PostgreSQL database in the `document_chunks` table using `pgvector`.
6. **Query Flow**: User asks a question -> query is embedded -> pgvector performs a cosine similarity search (`<=>`) -> top relevant chunks are injected into the context of the AI tutor -> grounded answer is returned.

## Environment Variables
- `DATABASE_URL`: Connection string for PostgreSQL.
- `GEMINI_API_KEY`: API key for Gemini models.
- `REDIS_URL`: Connection string for Redis.
- `ENVIRONMENT`: Environment mode (e.g., development, production).
- `JWT_SECRET_KEY`: Secret key for signing JWT tokens.
- `JWT_ALGORITHM`: Algorithm for JWT (default: HS256).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration time for JWT in minutes.
- `GEMINI_API_KEY`: API Key for Google Gemini. Get it from Google AI Studio.
- `GEMINI_MODEL`: Model name (default: gemini-2.5-flash).



## Future Roadmap
- Alembic database migrations configuration.
- Authentication and security.
- Gemini integration via the AI module.
- Vector embeddings extraction and storage.
- Multi-agent workflow capabilities.
