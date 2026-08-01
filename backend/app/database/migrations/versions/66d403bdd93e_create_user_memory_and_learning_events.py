"""create user memory and learning events

Revision ID: 66d403bdd93e
Revises: 7272a704363c
Create Date: 2026-07-28 16:02:24.807388

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66d403bdd93e'
down_revision: Union[str, Sequence[str], None] = '7272a704363c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from pgvector.sqlalchemy import Vector
    op.create_table(
        'user_memories',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('memory_type', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('importance_score', sa.Float(), nullable=True),
        sa.Column('embedding', Vector(dim=768), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_memories_id'), 'user_memories', ['id'], unique=False)

    op.create_table(
        'learning_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('topic', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_learning_events_id'), 'learning_events', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_learning_events_id'), table_name='learning_events')
    op.drop_table('learning_events')
    op.drop_index(op.f('ix_user_memories_id'), table_name='user_memories')
    op.drop_table('user_memories')
