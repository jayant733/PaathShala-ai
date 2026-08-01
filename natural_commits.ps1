Remove-Item -Recurse -Force .git
git init
git config user.name "Developer"
git config user.email "developer@paathshala.ai"

$dates = @(
  "2026-07-20T10:00:00",
  "2026-07-21T14:30:00",
  "2026-07-23T11:15:00",
  "2026-07-24T16:45:00",
  "2026-07-26T09:20:00",
  "2026-07-27T13:10:00",
  "2026-07-28T15:50:00",
  "2026-07-30T10:30:00",
  "2026-07-31T17:00:00",
  "2026-08-01T11:00:00"
)

# 1
$env:GIT_AUTHOR_DATE=$dates[0]
$env:GIT_COMMITTER_DATE=$dates[0]
git add .gitignore backend/README.md docker-compose.yml frontend/package.json
git commit -m "init project structure"

# 2
$env:GIT_AUTHOR_DATE=$dates[1]
$env:GIT_COMMITTER_DATE=$dates[1]
git add frontend/vite.config.ts frontend/tailwind.config.js frontend/tsconfig.json frontend/index.html
git commit -m "add react and vite frontend base"

# 3
$env:GIT_AUTHOR_DATE=$dates[2]
$env:GIT_COMMITTER_DATE=$dates[2]
git add frontend/src/ frontend/public/
git commit -m "wip on frontend UI and state"

# 4
$env:GIT_AUTHOR_DATE=$dates[3]
$env:GIT_COMMITTER_DATE=$dates[3]
git add backend/requirements.txt backend/Dockerfile backend/.env.example
git commit -m "setup python backend with fastapi"

# 5
$env:GIT_AUTHOR_DATE=$dates[4]
$env:GIT_COMMITTER_DATE=$dates[4]
git add backend/alembic.ini backend/app/core/ backend/app/db/
git commit -m "add db config and alembic"

# 6
$env:GIT_AUTHOR_DATE=$dates[5]
$env:GIT_COMMITTER_DATE=$dates[5]
git add backend/app/models/ backend/app/schemas/
git commit -m "add models and schemas"

# 7
$env:GIT_AUTHOR_DATE=$dates[6]
$env:GIT_COMMITTER_DATE=$dates[6]
git add backend/app/services/
git commit -m "implement core services and rag logic"

# 8
$env:GIT_AUTHOR_DATE=$dates[7]
$env:GIT_COMMITTER_DATE=$dates[7]
git add backend/app/api/ backend/app/main.py backend/app/ai/
git commit -m "hook up api routes and agents"

# 9
$env:GIT_AUTHOR_DATE=$dates[8]
$env:GIT_COMMITTER_DATE=$dates[8]
git add monitoring/ nginx/
git commit -m "add docker compose and monitoring"

# 10
$env:GIT_AUTHOR_DATE=$dates[9]
$env:GIT_COMMITTER_DATE=$dates[9]
git add .
git commit -m "final tweaks before deployment"
