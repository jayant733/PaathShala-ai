git config user.name "Developer"
git config user.email "developer@paathshala.ai"

# Commit 1
git add backend/README.md docker-compose.yml frontend/package.json
git commit -m "chore: initial project structure and dependencies"

# Commit 2
git add frontend/vite.config.ts frontend/tailwind.config.js frontend/tsconfig.json frontend/index.html
git commit -m "feat: setup React and Vite frontend configuration"

# Commit 3
git add frontend/src/ frontend/public/
git commit -m "feat: implement frontend UI components and state management"

# Commit 4
git add backend/requirements.txt backend/Dockerfile backend/.env.example
git commit -m "chore: setup FastAPI backend base and dependencies"

# Commit 5
git add backend/alembic.ini backend/app/core/ backend/app/db/
git commit -m "feat: add database configuration and alembic setup"

# Commit 6
git add backend/app/models/ backend/app/schemas/
git commit -m "feat: implement SQLAlchemy models and Pydantic schemas"

# Commit 7
git add backend/app/services/
git commit -m "feat: add core business logic, RAG, and AI services"

# Commit 8
git add backend/app/api/ backend/app/main.py backend/app/ai/
git commit -m "feat: implement FastAPI routers and LangGraph agents"

# Commit 9
git add monitoring/ nginx/
git commit -m "chore: setup observability stack (Prometheus, Grafana, Loki) and Nginx"

# Commit 10
git add .
git commit -m "fix: final project configurations, testing suite, and automation scripts"
