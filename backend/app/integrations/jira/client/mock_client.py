import datetime
from typing import Dict, Any, List, Optional
from app.integrations.jira.client.base_client import BaseJiraClient

class MockJiraClient(BaseJiraClient):
    """
    Zero-Config Local Mock Engine for Jira when API tokens are omitted.
    Generates realistic LOCALAI-XXX ticket keys and maintains state in memory.
    """
    def __init__(self, project_key: str = "LOCALAI"):
        self.project_key = project_key
        self.counter = 100
        self._issues: Dict[str, Dict[str, Any]] = {}

    async def create_issue(self, fields: Dict[str, Any]) -> Dict[str, Any]:
        self.counter += 1
        issue_key = f"{self.project_key}-{self.counter}"
        
        issue_data = {
            "key": issue_key,
            "id": str(self.counter),
            "project": self.project_key,
            "summary": fields.get("summary", "Untitled Incident"),
            "description": fields.get("description", ""),
            "priority": fields.get("priority", "P3 Medium"),
            "status": "OPEN",
            "labels": fields.get("labels", []),
            "services": fields.get("services", ["backend"]),
            "created_at": datetime.datetime.utcnow().isoformat(),
            "updated_at": datetime.datetime.utcnow().isoformat(),
            "comments": [],
            "attachments": fields.get("attachments", []),
            "ai_confidence_pct": fields.get("ai_confidence_pct", 85.0),
            "ai_summary": fields.get("ai_summary", {}),
            "timeline": fields.get("timeline", [])
        }

        self._issues[issue_key] = issue_data
        return issue_data

    async def add_comment(self, issue_key: str, comment_text: str) -> Dict[str, Any]:
        if issue_key in self._issues:
            comment = {
                "id": str(len(self._issues[issue_key]["comments"]) + 1),
                "author": "SRE Auto-Healer Bot",
                "body": comment_text,
                "created_at": datetime.datetime.utcnow().isoformat()
            }
            self._issues[issue_key]["comments"].append(comment)
            self._issues[issue_key]["updated_at"] = datetime.datetime.utcnow().isoformat()
            return comment
        return {"error": "Issue not found"}

    async def get_issue(self, issue_key: str) -> Optional[Dict[str, Any]]:
        return self._issues.get(issue_key)

    async def list_issues(self) -> List[Dict[str, Any]]:
        return sorted(list(self._issues.values()), key=lambda x: x["created_at"], reverse=True)

    def get_connection_status(self) -> Dict[str, Any]:
        return {
            "mode": "Mock Engine (Zero-Config)",
            "connected": True,
            "project_key": self.project_key,
            "total_issues": len(self._issues),
            "open_issues": sum(1 for i in self._issues.values() if i["status"] == "OPEN"),
            "resolved_issues": sum(1 for i in self._issues.values() if i["status"] in ["RESOLVED", "CLOSED"])
        }
