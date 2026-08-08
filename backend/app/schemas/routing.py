from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID

VALID_PROVIDERS = {"gemini", "ollama"}
VALID_CONDITION_TYPES = {"message_contains", "message_regex", "always"}

class RoutingRuleBase(BaseModel):
    name: str = ""
    condition_type: str = Field(..., description="message_contains | message_regex | always")
    condition_value: Optional[str] = None
    provider: str = Field(..., description="gemini | ollama")
    model: Optional[str] = None
    enabled: bool = True

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        if v not in VALID_PROVIDERS:
            raise ValueError(f"provider must be one of {sorted(VALID_PROVIDERS)}")
        return v

    @field_validator("condition_type")
    @classmethod
    def validate_condition_type(cls, v: str) -> str:
        if v not in VALID_CONDITION_TYPES:
            raise ValueError(f"condition_type must be one of {sorted(VALID_CONDITION_TYPES)}")
        return v

    @field_validator("condition_value")
    @classmethod
    def validate_condition_value(cls, v: Optional[str], info) -> Optional[str]:
        # "always" conditions don't need a value
        if info.data.get("condition_type") != "always" and not v:
            raise ValueError("condition_value is required unless condition_type is 'always'")
        return v

class RoutingRuleCreate(RoutingRuleBase):
    pass

class RoutingRuleUpdate(BaseModel):
    name: Optional[str] = None
    priority: Optional[int] = None
    condition_type: Optional[str] = None
    condition_value: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    enabled: Optional[bool] = None

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_PROVIDERS:
            raise ValueError(f"provider must be one of {sorted(VALID_PROVIDERS)}")
        return v

    @field_validator("condition_type")
    @classmethod
    def validate_condition_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_CONDITION_TYPES:
            raise ValueError(f"condition_type must be one of {sorted(VALID_CONDITION_TYPES)}")
        return v

class RoutingRuleRead(RoutingRuleBase):
    id: UUID
    priority: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RoutingRuleReorder(BaseModel):
    rule_ids: List[UUID]
