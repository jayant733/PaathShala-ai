"""create_routing_rules_table

Revision ID: c2a9d1e4f7b3
Revises: b691863bf206
Create Date: 2026-08-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c2a9d1e4f7b3'
down_revision: Union[str, Sequence[str], None] = 'b691863bf206'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('routing_rules',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('priority', sa.Integer(), nullable=True),
    sa.Column('name', sa.String(), nullable=True),
    sa.Column('condition_type', sa.String(), nullable=False),
    sa.Column('condition_value', sa.String(), nullable=True),
    sa.Column('provider', sa.String(), nullable=False),
    sa.Column('model', sa.String(), nullable=True),
    sa.Column('enabled', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routing_rules_id'), 'routing_rules', ['id'], unique=False)
    op.create_index(op.f('ix_routing_rules_user_id'), 'routing_rules', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_routing_rules_user_id'), table_name='routing_rules')
    op.drop_index(op.f('ix_routing_rules_id'), table_name='routing_rules')
    op.drop_table('routing_rules')
