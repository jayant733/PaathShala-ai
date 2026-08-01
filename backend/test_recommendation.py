import asyncio
import os
from dotenv import load_dotenv
from app.services.ai_service import AIService
from app.ai.agents.recommendation_agent import RecommendationAgent
from app.ai.llm.gemini import GeminiProvider

load_dotenv()

async def main():
    provider = GeminiProvider()
    ai = AIService(provider, None)
    
    agent = RecommendationAgent(ai)
    result = await agent.generate_recommendations(
        recent_conversations=["What are Transformers?", "Explain Attention Mechanism"],
        memories=["Knows: Basic Python", "Needs: Deep Learning Mathematics"]
    )
    print("Continue Learning:", result.continue_learning_title)
    for r in result.recommendations:
        print(r.title, "-", r.reason)

asyncio.run(main())
