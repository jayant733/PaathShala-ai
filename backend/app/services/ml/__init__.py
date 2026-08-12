"""Adaptive ML engine: knowledge mastery, spaced repetition, learning path.

Public surface (importable from the rest of the app):

- ``KnowledgeMasteryEngine`` — live Elo mastery updates + IRT/classifier training.
- ``ReviewScheduler`` — SM-2 spaced-repetition scheduling + Ebbinghaus decay.
- ``LearningPathRecommender`` — mastery-gap ranked learning path.
- ``get_backend`` / ``BACKENDS`` — the trainable model-backend registry.
"""

from app.services.ml.mastery import (
    KnowledgeMasteryEngine,
    observations_to_frame,
)
from app.services.ml.spaced_repetition import ReviewScheduler
from app.services.ml.recommender import LearningPathRecommender
from app.services.ml.backends import BACKENDS, FEATURE_COLS, get_backend

__all__ = [
    "KnowledgeMasteryEngine",
    "ReviewScheduler",
    "LearningPathRecommender",
    "observations_to_frame",
    "BACKENDS",
    "FEATURE_COLS",
    "get_backend",
]
