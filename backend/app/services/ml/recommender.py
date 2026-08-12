"""Learning-path recommender: mastery-gap ranking + content-similarity re-ranking.

Drives the dashboard "Learning Path". Ranking is two-stage:

1. **Mastery gap** — topics are ranked by ``gap = (1 - mastery) * confidence`` so
   the learner's weakest, most-tested topics surface first (status weak ->
   improving -> strong).
2. **Content similarity** — within a tie, candidate topics are scored against the
   learner's memory profile (``user_memories.embedding``) using cosine similarity,
   so a topic that matches what the student has actually studied/conversed about
   ranks above an equally-weak stranger.

This slice deliberately stops short of click-through logging or collaborative
filtering — it is mastery-gap + content similarity only.
"""

import logging
import math
from typing import Any, Optional
from uuid import UUID

from app.repositories.ml_repository import MLRepository
from app.services.ml.mastery import _normalize_topic

logger = logging.getLogger(__name__)

STATUS_ORDER = {"weak": 0, "improving": 1, "strong": 2}
_ACTION_BY_STATUS = {
    "weak": "Review fundamentals — start with easy questions to rebuild the base.",
    "improving": "Keep going — practice medium questions and consolidate with a spaced review.",
    "strong": "You've mastered this — reinforce with hard questions or teach it to someone.",
}


def _cosine(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two embedding vectors (0.0 when unembeddable)."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


def _topic_embedding(topic: str) -> list[float]:
    """Deterministic bag-of-char-n-grams (768-dim) topic embedding.

    Acts as a content-similarity fallback so ``rank_candidates`` never
    hard-depends on an embedding framework. Uses a stable FNV-style hash
    (not Python's randomized ``hash()``) so scores are reproducible.
    """
    vec = [0.0] * 768
    tokens = _normalize_topic(topic).lower()
    for i in range(len(tokens)):
        for k in (1, 2, 3):
            if i + k <= len(tokens):
                gram = tokens[i : i + k]
                h = 2166136261
                for ch in gram:
                    h ^= ord(ch)
                    h = (h * 16777619) & 0xFFFFFFFF
                vec[h % 768] += 1.0
    return vec


class LearningPathRecommender:
    def __init__(self, repo: MLRepository, embedding_provider: Optional[Any] = None):
        self.repo = repo
        self.embedding_provider = embedding_provider

    # ------------------------------------------------------------------ status helpers
    @staticmethod
    def mastery_status(mastery: float, confidence: float, attempts: int) -> str:
        if attempts == 0 or mastery < 0.4:
            return "weak"
        if mastery >= 0.7 and confidence >= 0.4:
            return "strong"
        if mastery >= 0.4:
            return "improving"
        return "weak"

    async def _get_memories(self, user_id: UUID) -> list[Any]:
        try:
            return await self.repo.get_user_memories(user_id)
        except Exception as exc:
            logger.warning("get_user_memories failed (%s); content-similarity disabled", exc)
            return []

    async def _memory_vector(self, user_id: UUID) -> list[float]:
        """Aggregate the learner's memory embeddings into a single profile vector."""
        memories = await self._get_memories(user_id)
        embeddings = [m.embedding for m in memories if getattr(m, "embedding", None)]
        if not embeddings:
            return []
        n = len(embeddings[0])
        profile = [0.0] * n
        for emb in embeddings:
            for i, v in enumerate(emb):
                profile[i] += float(v)
        norm = math.sqrt(sum(v * v for v in profile)) or 1.0
        return [v / norm for v in profile]

    # ------------------------------------------------------------------ public
    async def build_learning_path(self, user_id: UUID, topic_limit: int = 12) -> dict:
        """Ordered weak -> strong learning path with per-topic next steps.

        Uses calibrated item difficulty (``item_difficulty.b_param``) to order
        sub-topics easy -> hard within each status bucket.
        """
        mastery_rows = await self.repo.list_topic_mastery(user_id)
        if not mastery_rows:
            return {"items": [], "ordered_topics": []}

        items = []
        for m in mastery_rows:
            status = self.mastery_status(m.mastery, m.confidence, m.attempts)
            gap = (1.0 - m.mastery) * (m.confidence or 0.5)
            items.append(
                {
                    "topic": m.topic,
                    "mastery": round(m.mastery, 4),
                    "status": status,
                    "gap": gap,
                    "suggested_action": _ACTION_BY_STATUS.get(status, _ACTION_BY_STATUS["weak"]),
                    "next_topics": [],
                }
            )

        # weak/improving first, then strong; within status, largest gap first
        items.sort(key=lambda it: (STATUS_ORDER[it["status"]], -it["gap"]))
        items = items[:topic_limit]

        # compute easy->hard next topics using calibrated item difficulty
        all_items = await self.repo.list_item_difficulty()
        by_topic: dict[str, list[float]] = {}
        for item in all_items:
            if item.topic:
                by_topic.setdefault(_normalize_topic(item.topic), []).append(item.b_param or 0.0)

        for it in items:
            bparams = sorted(by_topic.get(it["topic"], []))
            if bparams:
                # foundations first (most negative b = easiest)
                it["next_topics"] = [f"{it['topic']} (easy)" if b < 0 else f"{it['topic']} (hard)" for b in bparams[:3]]

        return {
            "items": [{"topic": it["topic"], "mastery": it["mastery"], "status": it["status"],
                       "suggested_action": it["suggested_action"], "next_topics": it["next_topics"]}
                      for it in items],
            "ordered_topics": [it["topic"] for it in items],
        }

    async def rank_candidates(
        self,
        user_id: UUID,
        candidates: list[str],
        mastery_map: Optional[dict[str, float]] = None,
    ) -> list[str]:
        """Rank candidate topics: mastery gap first, content-similarity as tie-break.

        ``mastery_map`` is topic -> mastery (0..1). Unknown topics default to a
        mastery of 0 (a strong learning opportunity).
        """
        mastery_map = mastery_map or {}
        profile = await self._memory_vector(user_id)
        ranked: list[tuple[float, str]] = []

        for topic in candidates:
            mastery = mastery_map.get(topic, 0.0)
            gap = 1.0 - mastery
            sim = _cosine(_topic_embedding(topic), profile) if profile else 0.0
            # gap dominates (0..1); sim is a small additive tie-breaker
            score = gap + 0.1 * sim
            ranked.append((score, topic))

        ranked.sort(key=lambda t: -t[0])
        return [t for _, t in ranked]
