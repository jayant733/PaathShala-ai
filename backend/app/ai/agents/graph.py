from langgraph.graph import StateGraph, START, END
from app.ai.agents.state import AgentState
from app.ai.agents.supervisor import create_supervisor_node
from app.ai.agents.tutor_agent import create_tutor_node
from app.ai.agents.planner_agent import create_planner_node
from app.ai.agents.quiz_agent import create_quiz_node
from app.ai.agents.research_agent import create_research_node
from app.services.ai_service import AIService
from app.ai.agents.tools import AgentTools

def create_agent_graph(ai_service: AIService, tools: AgentTools):
    # Initialize nodes
    supervisor = create_supervisor_node(ai_service)
    tutor = create_tutor_node(ai_service, tools)
    planner = create_planner_node(ai_service)
    quiz = create_quiz_node(ai_service)
    research = create_research_node()
    
    # Initialize graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("supervisor", supervisor)
    workflow.add_node("tutor", tutor)
    workflow.add_node("planner", planner)
    workflow.add_node("quiz", quiz)
    workflow.add_node("research", research)
    
    # Add start edge
    workflow.add_edge(START, "supervisor")
    
    # Add conditional routing from supervisor
    def route_supervisor(state: AgentState):
        return state.get("next_agent", "tutor")
        
    workflow.add_conditional_edges(
        "supervisor",
        route_supervisor,
        {
            "tutor": "tutor",
            "planner": "planner",
            "quiz": "quiz",
            "research": "research"
        }
    )
    
    # Add end edges for all sub-agents
    workflow.add_edge("tutor", END)
    workflow.add_edge("planner", END)
    workflow.add_edge("quiz", END)
    workflow.add_edge("research", END)
    
    # Compile
    return workflow.compile()
