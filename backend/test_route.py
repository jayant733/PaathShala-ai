import asyncio
from app.database.session import AsyncSessionLocal
from app.services import routing_service

async def main():
    async with AsyncSessionLocal() as db:
        user_id = "5f26b713-44bc-4171-a80e-bdf5d462a2e1"
        rules = await routing_service.list_rules(db, user_id)
        print("Rules:", [r.__dict__ for r in rules])
        target = routing_service.resolve_target("Hello", rules)
        print("Target:", target)

if __name__ == "__main__":
    asyncio.run(main())
