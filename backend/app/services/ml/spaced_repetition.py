"""Spaced-repetition scheduler: SM-2 intervals + Ebbinghaus forgetting decay.

Every graded quiz attempt (or explicit review) is a *study event* for a topic.
The scheduler keeps SM-2 state per (user, topic) in ``review_schedule``:

- A correct review lengthens the interval (1 -> 3 -> 6 -> ... via ease factor);
- A wrong review collapses the interval back to 1 day and lowers the ease factor.

A topic is *due* when its scheduled ``due_date`` has passed OR when its
Ebbinghaus-decayed mastery has fallen below a floor — so even a strong topic
surfaces again once forgetting is likely. Both signals are returned to the
UI with a human-readable reason.
"""

import math
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from app.core.config import settings
from app.repositories.ml_repository import MLRepository

logger = logging.getLogger(__name__)

# Floor for SM-2 ease factor (never let it drop below).
MIN_EASE_FACTOR = 1.3
# Difficulty floor for "due" detection: decayed mastery below this => review now.
DECAY_THRESHOLD = 0.45
# Base intervals (days) for a fresh topic that is studied correctly.
_FIRST_INTERVAL_DAYS = 1


class ReviewScheduler:
    def __init__(self, repo: MLRepository, decay_lambda: Optional[float] = None):
        self.repo = repo
        self.decay_lambda = decay_lambda if decay_lambda is not None else settings.ML_FORGETTING_LAMBDA

    # ------------------------------------------------------------------ SM-2 core
    def next_interval(
        self,
        repetitions: int,
        interval_days: int,
        ease_factor: float,
        outcome: str,
    ) -> tuple[int, int, float]:
        """SM-2 transition. Returns (repetitions, interval_days, ease_factor)."""
        if outcome != "correct":
            return 0, _FIRST_INTERVAL_DAYS, max(MIN_EASE_FACTOR, ease_factor - 0.2)

        repetitions = repetitions + 1
        if repetitions == 1:
            interval = _FIRST_INTERVAL_DAYS
        elif repetitions == 2:
            interval = 3
        else:
            interval = math.ceil(interval_days * ease_factor)
        return repetitions, interval, ease_factor

    # ------------------------------------------------------------------ events
    async def record_study(self, user_id: UUID, topic: str, outcome: str) -> dict:
        """Record one study/review event for (user, topic). Outcome is 'correct'|'wrong'.

        Called from the quiz-submit loop (``KnowledgeMasteryEngine.update_from_submit``)
        and from ``POST /ml/reviews/complete``. Never raises — a scheduling hiccup
        must not break a quiz submission.
        """
        topic = (topic or "General").strip() or "General"
        try:
            row = await self.repo.get_review_schedule(user_id, topic)
            reps = row.repetitions if row else 0
            interval = row.interval_days if row else _FIRST_INTERVAL_DAYS
            ease = row.ease_factor if row else 2.5

            new_reps, new_interval, new_ease = self.next_interval(reps, interval, ease, outcome)
            now = datetime.now(timezone.utc)
            await self.repo.upsert_review_schedule(
                user_id=user_id,
                topic=topic,
                ease_factor=new_ease,
                repetitions=new_reps,
                interval_days=new_interval,
                due_date=now + timedelta(days=new_interval),
                last_reviewed_at=now,
            )
            return {
                "topic": topic,
                "next_due_date": now + timedelta(days=new_interval),
                "interval_days": new_interval,
                "ease_factor": new_ease,
            }
        except Exception as exc:
            logger.warning("record_study failed for %s/%s: %s", user_id, topic, exc)
            return {}

    # ------------------------------------------------------------------ decay
    def decayed_mastery(self, mastery: float, days_since_review: float) -> float:
        """Ebbinghaus forgetting curve: mastery * exp(-lambda * days)."""
        if days_since_review <= 0:
            return mastery
        return mastery * math.exp(-self.decay_lambda * days_since_review)

    async def get_due_reviews(self, user_id: UUID, now: Optional[datetime] = None) -> list[dict]:
        """Topics due for review: past due_date OR Ebbinghaus-decayed below threshold.

        Each item carries a ``reason`` so the UI can explain *why* (e.g. "High
        forgetting probability — last reviewed 6 days ago").
        """
        now = now or datetime.now(timezone.utc)
        schedules = await self.repo.list_review_schedules(user_id)
        mastery_rows = {m.topic: m for m in await self.repo.list_topic_mastery(user_id)}
        due: list[dict] = []

        for s in schedules:
            last = s.last_reviewed_at or s.updated_at or now
            days = max(0.0, (now - last).total_seconds() / 86400.0)
            mastery_row = mastery_rows.get(s.topic)
            base = mastery_row.mastery if mastery_row else 0.5
            decayed = self.decayed_mastery(base, days)

            if s.due_date and s.due_date <= now:
                reason = f"Past scheduled review date ({s.due_date.strftime('%b %d')})"
            elif decayed < DECAY_THRESHOLD:
                reason = (
                    f"High forgetting probability — estimated retention {decayed:.0%} "
                    f"after {days:.0f} day{'s' if days != 1 else ''}"
                )
            else:
                continue

            due.append(
                {
                    "topic": s.topic,
                    "due_date": s.due_date or now,
                    "interval_days": s.interval_days,
                    "ease_factor": s.ease_factor,
                    "repetitions": s.repetitions,
                    "decayed_mastery": round(decayed, 4),
                    "reason": reason,
                }
            )

        due.sort(key=lambda d: d["due_date"])
        return due
