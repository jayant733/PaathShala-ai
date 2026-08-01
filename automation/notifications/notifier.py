import httpx
import logging
from typing import Dict, Any, Optional
from automation.config.config_loader import global_sre_config

logger = logging.getLogger("SRENotifier")

class SRENotifier:
    """
    Multi-Channel Notification Dispatcher for Slack, Discord, Telegram, and System Console.
    """
    def __init__(self):
        cfg = global_sre_config.get("sre_config", {}).get("notifications", {})
        self.slack_url = cfg.get("slack_webhook_url", "")
        self.discord_url = cfg.get("discord_webhook_url", "")

    async def send_alert(self, title: str, message: str, level: str = "INFO"):
        prefix = "🚨 [CRITICAL]" if level == "CRITICAL" else ("⚠️ [WARNING]" if level == "WARNING" else "ℹ️ [INFO]")
        formatted = f"{prefix} *{title}*\n{message}"
        print(f"\n[SRE NOTIFIER] {formatted}")

        if self.discord_url:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    await client.post(self.discord_url, json={"content": formatted})
            except Exception as e:
                logger.warning(f"Notifier: Discord webhook failed: {e}")

global_notifier = SRENotifier()
