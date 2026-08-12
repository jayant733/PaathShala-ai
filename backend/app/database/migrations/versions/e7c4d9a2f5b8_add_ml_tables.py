"""add ml tables

Revision ID: e7c4d9a2f5b8
Revises: d5e4f3a2b1c9
Create Date: 2026-08-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7c4d9a2f5b8'
down_revision: Union[str, Sequence[str], None] = 'd5e4f3a2b1c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'topic_mastery',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('topic', sa.String(), nullable=False),
        sa.Column('elo_rating', sa.Float(), nullable=False, server_default='1500.0'),
        sa.Column('mastery', sa.Float(), nullable=False, server_default='0.5'),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('correct_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('wrong_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('p_correct', sa.Float(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'topic', name='uq_topic_mastery_user_topic'),
    )
    op.create_index(op.f('ix_topic_mastery_id'), 'topic_mastery', ['id'], unique=False)
    op.create_index(op.f('ix_topic_mastery_topic'), 'topic_mastery', ['topic'], unique=False)
    op.create_index(op.f('ix_topic_mastery_user_id'), 'topic_mastery', ['user_id'], unique=False)

    op.create_table(
        'mastery_observations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('question_id', sa.UUID(), nullable=False),
        sa.Column('topic', sa.String(), nullable=False),
        sa.Column('difficulty_label', sa.String(), nullable=True),
        sa.Column('question_type', sa.String(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('attempt_seq', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('recency_days', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_mastery_observations_created_at'), 'mastery_observations', ['created_at'], unique=False)
    op.create_index(op.f('ix_mastery_observations_id'), 'mastery_observations', ['id'], unique=False)
    op.create_index(op.f('ix_mastery_observations_question_id'), 'mastery_observations', ['question_id'], unique=False)
    op.create_index(op.f('ix_mastery_observations_user_id'), 'mastery_observations', ['user_id'], unique=False)

    op.create_table(
        'item_difficulty',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('question_id', sa.UUID(), nullable=False),
        sa.Column('topic', sa.String(), nullable=True),
        sa.Column('b_param', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('p_correct', sa.Float(), nullable=False, server_default='0.5'),
        sa.Column('n_attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_item_difficulty_id'), 'item_difficulty', ['id'], unique=False)
    op.create_index(op.f('ix_item_difficulty_question_id'), 'item_difficulty', ['question_id'], unique=True)

    op.create_table(
        'review_schedule',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('topic', sa.String(), nullable=False),
        sa.Column('ease_factor', sa.Float(), nullable=False, server_default='2.5'),
        sa.Column('repetitions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('interval_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'topic', name='uq_review_schedule_user_topic'),
    )
    op.create_index(op.f('ix_review_schedule_id'), 'review_schedule', ['id'], unique=False)
    op.create_index(op.f('ix_review_schedule_topic'), 'review_schedule', ['topic'], unique=False)
    op.create_index(op.f('ix_review_schedule_user_id'), 'review_schedule', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_review_schedule_user_id'), table_name='review_schedule')
    op.drop_index(op.f('ix_review_schedule_topic'), table_name='review_schedule')
    op.drop_index(op.f('ix_review_schedule_id'), table_name='review_schedule')
    op.drop_table('review_schedule')

    op.drop_index(op.f('ix_item_difficulty_question_id'), table_name='item_difficulty')
    op.drop_index(op.f('ix_item_difficulty_id'), table_name='item_difficulty')
    op.drop_table('item_difficulty')

    op.drop_index(op.f('ix_mastery_observations_user_id'), table_name='mastery_observations')
    op.drop_index(op.f('ix_mastery_observations_question_id'), table_name='mastery_observations')
    op.drop_index(op.f('ix_mastery_observations_id'), table_name='mastery_observations')
    op.drop_index(op.f('ix_mastery_observations_created_at'), table_name='mastery_observations')
    op.drop_table('mastery_observations')

    op.drop_index(op.f('ix_topic_mastery_user_id'), table_name='topic_mastery')
    op.drop_index(op.f('ix_topic_mastery_topic'), table_name='topic_mastery')
    op.drop_index(op.f('ix_topic_mastery_id'), table_name='topic_mastery')
    op.drop_table('topic_mastery')
