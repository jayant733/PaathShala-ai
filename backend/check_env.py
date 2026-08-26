import asyncio
import httpx
import json

async def main():
    url = "http://localhost:8000/api/v1/agent/chat/stream" # Actually I should just hit a health check endpoint if it exists
    # Let's write a small route in agent.py temporarily
