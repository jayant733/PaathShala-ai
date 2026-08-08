"""One-off: seed a rich conversation for the mobile-optimization test user."""
import asyncio
import json
from datetime import datetime, timezone

from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.database.models.user import User
from app.database.models.chat import Conversation, Message

EMAIL = "mobile.test@test.com"

PRESENTATION = {
    "answerType": "research",
    "title": "Distributed Systems Architecture",
    "summary": "A deep dive into how modern distributed systems scale, stay consistent, and tolerate failures — with the trade-offs every engineer must weigh.",
    "difficulty": "intermediate",
    "prerequisites": ["Networking basics", "Operating systems", "A bit of Python or Go"],
    "nextTopics": ["Kubernetes deep dive", "Database replication", "Event-driven design"],
    "concepts": ["Horizontal scaling", "Consistency models", "Partition tolerance", "Idempotency"],
    "sections": [
        {"title": "The CAP Theorem", "content": "A distributed system can only guarantee two of three: **Consistency**, **Availability**, and **Partition tolerance**. In practice, network partitions happen, so you pick CP or AP."},
        {"title": "Consistency Models", "content": "From strong to eventual. **Linearizable** reads feel single-machine but cost latency; **eventual consistency** sacrifices freshness for availability."},
    ],
    "diagram": "graph TD\n  A[Client] --> B[Load Balancer]\n  B --> C[Service A]\n  B --> D[Service B]\n  C --> E[(Primary DB)]\n  C --> F[(Replica)]\n  D --> E\n  E -->|stream| F",
    "images": [
        {"query": "distributed system diagram", "title": "Architecture", "description": "High-level topology"}
    ],
    "cards": [
        {"icon": "cpu", "title": "Stateless Services", "description": "Services hold no session state, so any instance can serve any request — enabling effortless horizontal scaling."},
        {"icon": "database", "title": "Eventual Consistency", "description": "Replicas converge over time. Great for reads-heavy workloads like timelines and analytics."},
        {"icon": "shield", "title": "Idempotent Operations", "description": "Retrying a request yields the same result, making retries safe under network flakiness."},
        {"icon": "network", "title": "Circuit Breakers", "description": "Fail fast and open the circuit when a dependency degrades, preventing cascading outages."},
    ],
    "steps": [
        {"title": "Partition data", "description": "Shard by a key (user_id, region) so each node owns a slice."},
        {"title": "Replicate for durability", "description": "Replica copies ensure a node loss doesn't mean data loss."},
        {"title": "Add a load balancer", "description": "Distribute traffic across instances and health-check them."},
        {"title": "Observe & retune", "description": "Track p99 latency and error rates; adjust shard count as load grows."},
    ],
    "tech": ["Kafka", "PostgreSQL", "Redis", "Docker", "gRPC"],
    "comparison": {
        "columns": ["SQL", "NoSQL"],
        "rows": [
            ["Strict schema", "Flexible schema"],
            ["Strong consistency", "Eventual consistency"],
            ["Vertical scale often", "Horizontal scale by design"],
            ["Joins built in", "Denormalized reads"],
        ],
    },
    "suggestedActions": [
        {"title": "Explain Components", "prompt": "Explain each component of the Distributed Systems Architecture in detail."},
        {"title": "Interview Questions", "prompt": "Generate 5 system design interview questions about Distributed Systems."},
    ],
}

MARKDOWN_MESSAGE = """# Quick Reference

A plain markdown fallback with code and lists.

```python
def retry(fn, times=3):
    for i in range(times):
        try:
            return fn()
        except Exception:
            if i == times - 1:
                raise
            time.sleep(2 ** i)
```

- Retries with **exponential backoff**
- Idempotent by design
"""


async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == EMAIL))
        user = result.scalars().first()
        if not user:
            print("user not found:", EMAIL)
            return

        now = datetime.now(timezone.utc)
        conv = Conversation(user_id=user.id, title="Distributed Systems", created_at=now)
        session.add(conv)
        await session.flush()

        env = f"%%%PAATHSHALA:research%%%\n{json.dumps(PRESENTATION, indent=2)}\n%%%END%%%"

        session.add_all([
            Message(conversation_id=conv.id, role="user", content="Teach me about distributed systems.", created_at=now),
            Message(conversation_id=conv.id, role="assistant", content=env,
                    provider="gemini", model_used="gemini-2.5-flash", created_at=now),
            Message(conversation_id=conv.id, role="user", content="Now give me a code quick-reference.", created_at=now),
            Message(conversation_id=conv.id, role="assistant", content=MARKDOWN_MESSAGE,
                    provider="gemini", model_used="gemini-2.5-flash", created_at=now),
        ])
        await session.commit()
        print("seeded conversation:", conv.id)


asyncio.run(main())
