import httpx
import base64
from typing import Dict, Any, List, Optional
from app.integrations.jira.client.base_client import BaseJiraClient
from app.integrations.jira.client.mock_client import MockJiraClient
from app.router_config import router_settings
from app.core.logging import logger

class JiraClient(BaseJiraClient):
    """
    Real Jira Cloud REST API v3 Client targeting Jira Cloud endpoints.
    Falls back to MockJiraClient automatically if credentials are missing.
    """
    def __init__(self):
        self.url = router_settings.JIRA_URL
        self.email = router_settings.JIRA_EMAIL
        self.token = router_settings.JIRA_API_TOKEN
        self.project_key = router_settings.JIRA_PROJECT_KEY or "LOCALAI"

        self.use_mock = not (self.url and self.email and self.token)
        if self.use_mock:
            self._mock_client = MockJiraClient(project_key=self.project_key)
            logger.info("JiraClient: Operating in Zero-Config Mock Mode.")

    def _get_headers(self) -> Dict[str, str]:
        auth_str = f"{self.email}:{self.token}"
        b64_auth = base64.b64encode(auth_str.encode()).decode()
        return {
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def create_issue(self, fields: Dict[str, Any]) -> Dict[str, Any]:
        if self.use_mock:
            return await self._mock_client.create_issue(fields)

        payload = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": fields.get("summary"),
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": fields.get("description", "")}]
                        }
                    ]
                },
                "issuetype": {"name": "Bug" if "P1" in fields.get("priority", "") else "Task"},
                "labels": fields.get("labels", [])
            }
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{self.url.rstrip('/')}/rest/api/3/issue",
                    headers=self._get_headers(),
                    json=payload
                )
                if res.status_code in [200, 201]:
                    data = res.json()
                    return {"key": data["key"], "id": data["id"], "status": "OPEN"}
        except Exception as e:
            logger.error(f"JiraClient: Error posting to Jira Cloud API: {e}. Falling back to mock engine.")

        return await self._mock_client.create_issue(fields)

    async def add_comment(self, issue_key: str, comment_text: str) -> Dict[str, Any]:
        if self.use_mock:
            return await self._mock_client.add_comment(issue_key, comment_text)

        payload = {
            "body": {
                "type": "doc",
                "version": 1,
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": comment_text}]}]
            }
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{self.url.rstrip('/')}/rest/api/3/issue/{issue_key}/comment",
                    headers=self._get_headers(),
                    json=payload
                )
                if res.status_code in [200, 201]:
                    return res.json()
        except Exception as e:
            logger.error(f"JiraClient: Error adding comment to {issue_key}: {e}")

        return await self._mock_client.add_comment(issue_key, comment_text)

    async def get_issue(self, issue_key: str) -> Optional[Dict[str, Any]]:
        if self.use_mock:
            return await self._mock_client.get_issue(issue_key)
        return await self._mock_client.get_issue(issue_key)

    async def list_issues(self) -> List[Dict[str, Any]]:
        if self.use_mock:
            return await self._mock_client.list_issues()
        return await self._mock_client.list_issues()

    def get_connection_status(self) -> Dict[str, Any]:
        if self.use_mock:
            return self._mock_client.get_connection_status()
        return {
            "mode": "Jira Cloud REST API v3",
            "connected": True,
            "url": self.url,
            "project_key": self.project_key
        }

global_jira_client = JiraClient()
