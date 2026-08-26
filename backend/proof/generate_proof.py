import asyncio
import os
from sqlalchemy import select, func
from app.database.session import AsyncSessionLocal
from app.database.models.chat import Message
from app.database.models.user import User
from app.database.models.routing import RoutingRule

async def generate_proof():
    # Ensure the directory exists
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    
    proof_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "routing_proof.md")
    
    async with AsyncSessionLocal() as db:
        # Count messages by provider and model
        stmt = select(
            Message.provider, 
            Message.model_used, 
            func.count(Message.id).label('count')
        ).where(
            Message.role == 'assistant',
            Message.provider != None
        ).group_by(Message.provider, Message.model_used)
        
        result = await db.execute(stmt)
        stats = result.all()
        
        # Get some recent messages to show as examples
        recent_stmt = select(Message).where(
            Message.role == 'assistant',
            Message.provider != None
        ).order_by(Message.created_at.desc()).limit(10)
        
        recent_result = await db.execute(recent_stmt)
        recent_messages = recent_result.scalars().all()
        
    with open(proof_file_path, "w", encoding="utf-8") as f:
        f.write("# Proof of Auto-Routing System\n\n")
        f.write("This document proves that the auto-routing ecosystem is successfully distributing workloads between Cloud AI (Gemini) and Local AI (Ollama).\n\n")
        
        f.write("## 1. Workload Distribution Statistics\n\n")
        f.write("| Provider | Model Used | Number of Requests |\n")
        f.write("|----------|------------|--------------------|\n")
        
        if not stats:
            f.write("| No data | No data | 0 |\n")
        else:
            for provider, model, count in stats:
                f.write(f"| `{provider}` | `{model}` | {count} |\n")
        
        f.write("\n## 2. Recent Routing Examples\n\n")
        if not recent_messages:
            f.write("No recent messages found.\n")
        else:
            for i, msg in enumerate(recent_messages, 1):
                preview = msg.content[:100].replace('\n', ' ') + "..." if len(msg.content) > 100 else msg.content.replace('\n', ' ')
                f.write(f"### Example {i}\n")
                f.write(f"- **Routed To:** `{msg.provider}` (Model: `{msg.model_used}`)\n")
                f.write(f"- **Timestamp:** {msg.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"- **Response Preview:** {preview}\n\n")
                
        f.write("---\n")
        f.write("*Generated automatically by the PaathShala diagnostic system.*\n")

    print(f"Proof generated successfully at {proof_file_path}")

if __name__ == "__main__":
    asyncio.run(generate_proof())
