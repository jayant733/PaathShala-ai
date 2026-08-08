import re
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database.models.routing import RoutingRule


def resolve_target(message: str, rules: List[RoutingRule]) -> Optional[Tuple[str, Optional[str]]]:
    """Evaluate rules in priority order and return the first matching target.

    Returns a ``(provider, model)`` tuple, or ``None`` if no enabled rule matched.
    ``model`` may be ``None`` to signal "use the provider's default model".
    """
    normalized = message or ""
    for rule in sorted(rules, key=lambda r: (r.priority, r.created_at)):
        if not rule.enabled:
            continue

        matches = False
        if rule.condition_type == "always":
            matches = True
        elif rule.condition_type == "message_contains":
            needle = rule.condition_value or ""
            matches = needle.lower() in normalized.lower()
        elif rule.condition_type == "message_regex":
            pattern = rule.condition_value or ""
            try:
                matches = re.search(pattern, normalized) is not None
            except re.error:
                matches = False

        if matches:
            return (rule.provider, rule.model)

    return None


async def list_rules(db: AsyncSession, user_id: UUID) -> List[RoutingRule]:
    stmt = select(RoutingRule).where(RoutingRule.user_id == user_id).order_by(RoutingRule.priority)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_rule(db: AsyncSession, user_id: UUID, data) -> RoutingRule:
    # Append at the end: priority = max existing priority + 1
    stmt = select(RoutingRule).where(RoutingRule.user_id == user_id)
    result = await db.execute(stmt)
    existing = list(result.scalars().all())
    next_priority = (max((r.priority for r in existing), default=-1)) + 1

    rule = RoutingRule(
        user_id=user_id,
        priority=next_priority,
        name=data.name,
        condition_type=data.condition_type,
        condition_value=data.condition_value,
        provider=data.provider,
        model=data.model,
        enabled=data.enabled,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


async def update_rule(db: AsyncSession, user_id: UUID, rule_id: UUID, data) -> Optional[RoutingRule]:
    result = await db.execute(
        select(RoutingRule).where(RoutingRule.id == rule_id, RoutingRule.user_id == user_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(rule, field, value)
    await db.commit()
    await db.refresh(rule)
    return rule


async def delete_rule(db: AsyncSession, user_id: UUID, rule_id: UUID) -> bool:
    result = await db.execute(
        select(RoutingRule).where(RoutingRule.id == rule_id, RoutingRule.user_id == user_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        return False
    await db.delete(rule)
    await db.commit()
    return True


async def reorder_rules(db: AsyncSession, user_id: UUID, rule_ids: List[UUID]) -> List[RoutingRule]:
    """Set each rule's priority to its position in ``rule_ids`` (0-based)."""
    rules = {r.id: r for r in await list_rules(db, user_id)}
    for index, rule_id in enumerate(rule_ids):
        rule = rules.get(rule_id)
        if rule:
            rule.priority = index
    await db.commit()
    return await list_rules(db, user_id)
