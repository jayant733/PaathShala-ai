from typing import Any, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from app.database.models.quiz import Quiz, Question, QuizAttempt
from app.database.models.chat import Conversation, Message
from app.database.models.ai import AIInteraction


class QuizRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ------------------------------------------------------------------ Quizzes
    async def get_quiz(self, quiz_id: UUID, with_questions: bool = True) -> Optional[Quiz]:
        stmt = select(Quiz).where(Quiz.id == quiz_id)
        if with_questions:
            stmt = stmt.options(selectinload(Quiz.questions))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_quizzes(
        self,
        user_id: UUID,
        status: Optional[str] = None,
        subject: Optional[str] = None,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
    ) -> list[Quiz]:
        stmt = select(Quiz).options(selectinload(Quiz.questions)).where(Quiz.created_by == user_id)
        if status:
            stmt = stmt.where(Quiz.status == status)
        if subject:
            stmt = stmt.where(Quiz.subject.ilike(f"%{subject}%"))
        if difficulty:
            stmt = stmt.where(Quiz.difficulty == difficulty)
        if search:
            stmt = stmt.where(Quiz.title.ilike(f"%{search}%"))
        stmt = stmt.order_by(desc(Quiz.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_quiz(self, user_id: UUID, data: dict, questions: list[dict]) -> Quiz:
        quiz = Quiz(created_by=user_id, **data)
        for idx, q in enumerate(questions):
            quiz.questions.append(Question(order_index=idx, **q))
        self.session.add(quiz)
        await self.session.commit()
        await self.session.refresh(quiz)
        return quiz

    async def update_quiz(self, quiz: Quiz, data: dict, questions: list[dict]) -> Quiz:
        for key, value in data.items():
            setattr(quiz, key, value)
        quiz.questions.clear()
        for idx, q in enumerate(questions):
            quiz.questions.append(Question(order_index=idx, **q))
        await self.session.commit()
        await self.session.refresh(quiz)
        return quiz

    async def delete_quiz(self, quiz: Quiz) -> None:
        await self.session.delete(quiz)
        await self.session.commit()

    async def save_quiz(self, quiz: Quiz, updates: dict) -> Quiz:
        for key, value in updates.items():
            setattr(quiz, key, value)
        await self.session.commit()
        await self.session.refresh(quiz)
        return quiz

    # ----------------------------------------------------------------- Attempts
    async def create_attempt(self, quiz_id: UUID, user_id: UUID) -> QuizAttempt:
        attempt = QuizAttempt(quiz_id=quiz_id, user_id=user_id)
        self.session.add(attempt)
        await self.session.commit()
        await self.session.refresh(attempt)
        return attempt

    async def get_attempt(self, attempt_id: UUID, user_id: UUID) -> Optional[QuizAttempt]:
        stmt = select(QuizAttempt).where(QuizAttempt.id == attempt_id, QuizAttempt.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def save_attempt(self, attempt: QuizAttempt, updates: dict) -> QuizAttempt:
        for key, value in updates.items():
            setattr(attempt, key, value)
        await self.session.commit()
        await self.session.refresh(attempt)
        return attempt

    async def list_user_attempts(self, user_id: UUID) -> list[QuizAttempt]:
        stmt = select(QuizAttempt).where(QuizAttempt.user_id == user_id).order_by(desc(QuizAttempt.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ---------------------------------------------------- Sources (history picker)
    async def get_conversation(self, conversation_id: UUID, user_id: UUID) -> Optional[Conversation]:
        stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_conversation_messages(self, conversation_id: UUID) -> list[Message]:
        stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_interaction(self, interaction_id: UUID, user_id: UUID) -> Optional[AIInteraction]:
        stmt = select(AIInteraction).where(AIInteraction.id == interaction_id, AIInteraction.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_sources(self, user_id: UUID, search: Optional[str] = None, limit: int = 50) -> list[dict[str, Any]]:
        """Merged, newest-first list of conversations + AI interactions for the history picker."""
        conv_stmt = select(Conversation).where(Conversation.user_id == user_id).order_by(desc(Conversation.created_at)).limit(limit)
        conversations = (await self.session.execute(conv_stmt)).scalars().all()

        # First user message per conversation for the preview (single query, no N+1)
        previews: dict[UUID, str] = {}
        conv_ids = [c.id for c in conversations]
        if conv_ids:
            msg_stmt = (
                select(Message)
                .where(Message.conversation_id.in_(conv_ids), Message.role == "user")
                .order_by(Message.created_at)
            )
            messages = (await self.session.execute(msg_stmt)).scalars().all()
            seen: set[UUID] = set()
            for m in messages:
                if m.conversation_id not in seen:
                    previews[m.conversation_id] = m.content
                    seen.add(m.conversation_id)

        int_stmt = select(AIInteraction).where(AIInteraction.user_id == user_id).order_by(desc(AIInteraction.created_at)).limit(limit)
        interactions = (await self.session.execute(int_stmt)).scalars().all()

        items: list[dict[str, Any]] = []
        for c in conversations:
            title = c.title or "AI Conversation"
            preview = previews.get(c.id, "") or ""
            if search and search.lower() not in (title + preview).lower():
                continue
            items.append({
                "id": c.id,
                "source_type": "conversation",
                "title": title,
                "preview": preview[:200],
                "created_at": c.created_at,
            })
        for i in interactions:
            title = i.prompt[:80]
            preview = i.prompt
            if search and search.lower() not in preview.lower():
                continue
            items.append({
                "id": i.id,
                "source_type": "interaction",
                "title": title,
                "preview": preview[:200],
                "created_at": i.created_at,
            })

        items.sort(key=lambda x: x["created_at"], reverse=True)
        return items[:limit]
