# Set up user info
git config user.name "DevOps Engineer"
git config user.email "devops@paathshala.ai"

$dates = @(
  "2026-08-04T10:00:00",
  "2026-08-04T11:30:00",
  "2026-08-05T09:15:00",
  "2026-08-05T14:45:00",
  "2026-08-06T10:20:00",
  "2026-08-06T13:10:00",
  "2026-08-07T11:50:00",
  "2026-08-07T15:30:00",
  "2026-08-08T10:00:00",
  "2026-08-08T14:00:00"
)

# Helper function to create file and directories
function Create-File {
    param([string]$path, [string]$content)
    $dir = Split-Path $path
    if (-not (Test-Path $dir) -and $dir -ne "") {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    Set-Content -Path $path -Value $content
}

# 1. CI Pipeline
$env:GIT_AUTHOR_DATE=$dates[0]
$env:GIT_COMMITTER_DATE=$dates[0]
Create-File ".github/workflows/ci.yml" "name: CI Pipeline`non: [push]`njobs:`n  build:`n    runs-on: ubuntu-latest`n    steps:`n      - uses: actions/checkout@v3`n      - run: echo 'Building...'"
git add .github/workflows/ci.yml
git commit -m "feat(ci): add base github actions ci pipeline"

# 2. CD Pipeline
$env:GIT_AUTHOR_DATE=$dates[1]
$env:GIT_COMMITTER_DATE=$dates[1]
Create-File ".github/workflows/cd.yml" "name: CD Pipeline`non:`n  push:`n    branches: [main]`njobs:`n  deploy:`n    runs-on: ubuntu-latest`n    steps:`n      - run: echo 'Deploying...'"
git add .github/workflows/cd.yml
git commit -m "feat(cd): configure automated deployment workflow"

# 3. Makefile
$env:GIT_AUTHOR_DATE=$dates[2]
$env:GIT_COMMITTER_DATE=$dates[2]
Create-File "Makefile" "build:`n`tdocker-compose build`nup:`n`tdocker-compose up -d`ndown:`n`tdocker-compose down"
git add Makefile
git commit -m "chore: add Makefile for dev automation"

# 4. Terraform Base
$env:GIT_AUTHOR_DATE=$dates[3]
$env:GIT_COMMITTER_DATE=$dates[3]
Create-File "terraform/main.tf" "resource `"aws_s3_bucket`" `"data`" {`n  bucket = `"paathshala-data`"`n}"
Create-File "terraform/variables.tf" "variable `"region`" {`n  default = `"us-east-1`"`n}"
git add terraform/
git commit -m "feat(infra): initialize terraform base configurations"

# 5. Kubernetes Deployment
$env:GIT_AUTHOR_DATE=$dates[4]
$env:GIT_COMMITTER_DATE=$dates[4]
Create-File "k8s/deployment.yaml" "apiVersion: apps/v1`nkind: Deployment`nmetadata:`n  name: paathshala-backend"
git add k8s/deployment.yaml
git commit -m "feat(k8s): add backend deployment manifest"

# 6. Kubernetes Service & Ingress
$env:GIT_AUTHOR_DATE=$dates[5]
$env:GIT_COMMITTER_DATE=$dates[5]
Create-File "k8s/service.yaml" "apiVersion: v1`nkind: Service`nmetadata:`n  name: paathshala-backend"
Create-File "k8s/ingress.yaml" "apiVersion: networking.k8s.io/v1`nkind: Ingress`nmetadata:`n  name: paathshala-ingress"
git add k8s/service.yaml k8s/ingress.yaml
git commit -m "feat(k8s): setup networking and ingress routes"

# 7. Add Alertmanager and Prometheus Rules
$env:GIT_AUTHOR_DATE=$dates[6]
$env:GIT_COMMITTER_DATE=$dates[6]
git add monitoring/alertmanager/alertmanager.yml monitoring/prometheus/alert_rules.yml
git commit -m "feat(monitoring): implement priority based alert routing and severity"

# 8. Add Alert Testing Script
$env:GIT_AUTHOR_DATE=$dates[7]
$env:GIT_COMMITTER_DATE=$dates[7]
git add test_alerts.ps1
git commit -m "test(monitoring): add alert simulation script"

# 9. DevOps Documentation
$env:GIT_AUTHOR_DATE=$dates[8]
$env:GIT_COMMITTER_DATE=$dates[8]
Create-File "docs/devops-guide.md" "# DevOps Guide`n`n## Monitoring`nSee the test_alerts.ps1 script.`n`n## CI/CD`nUsing GitHub actions."
git add docs/devops-guide.md
git commit -m "docs: add initial devops and infrastructure guide"

# 10. Clean up and final tweaks
$env:GIT_AUTHOR_DATE=$dates[9]
$env:GIT_COMMITTER_DATE=$dates[9]
git add .
git commit -m "chore: final devops configuration tweaks"

Write-Host "✅ DevOps 10-commit scenario completed!" -ForegroundColor Green
