"""create ai_interactions table

Revision ID: 36e7ac92fe7e
Revises: 9efb0eb177a7
Create Date: 2026-07-28 13:01:17.391833

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '36e7ac92fe7e'
down_revision: Union[str, Sequence[str], None] = '9efb0eb177a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'ai_interactions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('prompt', sa.String(), nullable=False),
        sa.Column('response', sa.String(), nullable=False),
        sa.Column('model_used', sa.String(), nullable=False),
        sa.Column('input_tokens', sa.Integer(), nullable=True),
        sa.Column('output_tokens', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_interactions_id'), 'ai_interactions', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_ai_interactions_id'), table_name='ai_interactions')
    op.drop_table('ai_interactions')
