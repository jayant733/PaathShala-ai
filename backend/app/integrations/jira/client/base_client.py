from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseJiraClient(ABC):
    @abstractmethod
    async def create_issue(self, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Jira issue and return details including key."""
        pass

    @abstractmethod
    async def add_comment(self, issue_key: str, comment_text: str) -> Dict[str, Any]:
        """Add a comment to an existing issue."""
        pass

    @abstractmethod
    async def get_issue(self, issue_key: str) -> Optional[Dict[str, Any]]:
        """Get issue details by key."""
        pass

    @abstractmethod
    async def list_issues(self) -> List[Dict[str, Any]]:
        """List active issues."""
        pass

    @abstractmethod
    def get_connection_status(self) -> Dict[str, Any]:
        """Get client status."""
        pass
