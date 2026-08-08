from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.database.models.user import User
from app.schemas.routing import (
    RoutingRuleCreate,
    RoutingRuleUpdate,
    RoutingRuleRead,
    RoutingRuleReorder,
)
from app.services import routing_service

router = APIRouter(prefix="/router/rules", tags=["router"])


@router.get("", response_model=List[RoutingRuleRead])
async def list_routing_rules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await routing_service.list_rules(db, current_user.id)


@router.post("", response_model=RoutingRuleRead, status_code=status.HTTP_201_CREATED)
async def create_routing_rule(
    payload: RoutingRuleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await routing_service.create_rule(db, current_user.id, payload)


@router.put("/{rule_id}", response_model=RoutingRuleRead)
async def update_routing_rule(
    rule_id: UUID,
    payload: RoutingRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rule = await routing_service.update_rule(db, current_user.id, rule_id, payload)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routing rule not found")
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_routing_rule(
    rule_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await routing_service.delete_rule(db, current_user.id, rule_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routing rule not found")


@router.put("/reorder", response_model=List[RoutingRuleRead])
async def reorder_routing_rules(
    payload: RoutingRuleReorder,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await routing_service.reorder_rules(db, current_user.id, payload.rule_ids)
