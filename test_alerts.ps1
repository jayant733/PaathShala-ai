$AlertManagerUrl = "http://localhost:9093/api/v1/alerts"

Write-Host "🚨 Simulating a CRITICAL alert (Should route to #devops)..." -ForegroundColor Red
$criticalAlert = @(
    @{
        labels = @{
            alertname = "BackendServiceDown"
            instance = "backend-01"
            service = "api"
            env = "production"
            severity = "critical"
        }
        annotations = @{
            description = "The backend service is completely unresponsive."
            impact = "Total API outage. Frontend cannot fetch data."
            oncall_team = "@devops-oncall"
        }
    }
) | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri $AlertManagerUrl -Method Post -Body $criticalAlert -ContentType "application/json"

Start-Sleep -Seconds 2

Write-Host "⚠️ Simulating a WARNING alert (Should route to #main1)..." -ForegroundColor Yellow
$warningAlert = @(
    @{
        labels = @{
            alertname = "HighCPUUsage"
            instance = "backend-01"
            service = "api"
            env = "production"
            severity = "warning"
        }
        annotations = @{
            description = "CPU usage is hovering around 85% for the last 10 minutes."
            impact = "Potential latency increase."
            oncall_team = "@devops-team"
        }
    }
) | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri $AlertManagerUrl -Method Post -Body $warningAlert -ContentType "application/json"

Write-Host "`n✅ Test alerts sent! Check your Slack channels." -ForegroundColor Green
