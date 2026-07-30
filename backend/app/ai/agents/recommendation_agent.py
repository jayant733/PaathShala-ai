import json
from typing import List
from app.services.ai_service import AIService
from app.schemas.dashboard import Recommendation

class RecommendationAgentOutput:
    def __init__(self, recommendations: List[Recommendation], continue_learning_title: str, continue_learning_progress: int):
        self.recommendations = recommendations
        self.continue_learning_title = continue_learning_title
        self.continue_learning_progress = continue_learning_progress

class RecommendationAgent:
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service

    async def generate_recommendations(
        self, 
        recent_conversations: List[str], 
        memories: List[str]
    ) -> RecommendationAgentOutput:
        
        import time
        system_prompt = """
        You are an intelligent, highly creative learning recommendation agent for PaathShala AI.
        Your job is to generate personalized, randomized dashboard recommendations based on the user's history.
        
        CRITICAL RULES:
        1. Recommendations MUST be strictly about academic, scientific, technical, or general knowledge studying (e.g., Physics, History, Programming, Biology).
        2. DO NOT recommend meta-platform features like "Explore Platform" or "How to use PaathShala". Ignore any history related to this.
        3. Be highly creative and varied. NEVER give the exact same recommendations twice.
        4. If the user has no history or only meta-history, invent completely random, fascinating academic topics (e.g., "Quantum Mechanics", "Roman Empire", "Introduction to Python").

        You MUST respond with a JSON object in this exact format:
        {
            "recommendations": [
                {"title": "Learn X", "reason": "Because of Y"},
                {"title": "Review A", "reason": "Since you struggled with B"},
                {"title": "Explore C", "reason": "To build on D"}
            ],
            "continue_learning_title": "Title here",
            "continue_learning_progress": 25
        }
        Generate exactly 3 recommendations. 
        Do not include markdown blocks or any other text.
        """

        prompt = f"""
        Recent Conversations:
        {chr(10).join(recent_conversations) if recent_conversations else "No recent conversations."}

        User Memories (Strengths and Weaknesses):
        {chr(10).join(memories) if memories else "No specific memory nodes yet."}
        
        Random Seed to ensure variety: {time.time()}
        """
        
        result = await self.ai_service.provider.generate_response(
            prompt=prompt,
            system_instruction=system_prompt
        )
        
        response_text = result["response_text"].strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        try:
            data = json.loads(response_text)
            recs = [Recommendation(**r) for r in data.get("recommendations", [])][:3]
            
            # fallback if not enough recs
            while len(recs) < 3:
                recs.append(Recommendation(title="Keep Learning", reason="Start a new chat to get tailored suggestions!"))
                
            return RecommendationAgentOutput(
                recommendations=recs,
                continue_learning_title=data.get("continue_learning_title", "Start a new topic"),
                continue_learning_progress=int(data.get("continue_learning_progress", 0))
            )
        except Exception:
            # Fallback
            return RecommendationAgentOutput(
                recommendations=[Recommendation(title="Keep Learning", reason="Start a new chat to get tailored suggestions!")],
                continue_learning_title="Continue your journey",
                continue_learning_progress=0
            )
