import asyncio
import sys
from uuid import UUID
from app.database.session import AsyncSessionLocal
from app.api.routes.chat import get_conversation_context
from app.database.models.user import User

async def main():
    user_id = UUID("5f26b713-44bc-4171-a80e-bdf5d462a2e1")
    conv_id = UUID("f4ca344c-074a-4c3a-a7da-317abcf53742")
    user = User(id=user_id)
    
    try:
        async with AsyncSessionLocal() as db:
            res = await get_conversation_context(conv_id, user, db)
            print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
