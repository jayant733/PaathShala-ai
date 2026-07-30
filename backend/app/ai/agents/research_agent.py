from app.ai.agents.state import AgentState

def create_research_node():
    async def research_node(state: AgentState) -> dict:
        # Placeholder for future web search integration
        placeholder_response = "The Research Agent is currently in development. Soon I will be able to search the web for external resources regarding your request."
        
        return {"agent_response": placeholder_response}
        
    return research_node
