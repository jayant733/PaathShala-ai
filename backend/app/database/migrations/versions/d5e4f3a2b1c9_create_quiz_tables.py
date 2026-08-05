"""create_quiz_tables

Revision ID: d5e4f3a2b1c9
Revises: c2a9d1e4f7b3
Create Date: 2026-08-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd5e4f3a2b1c9'
down_revision: Union[str, Sequence[str], None] = 'c2a9d1e4f7b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('quizzes',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('subject', sa.String(), nullable=True),
    sa.Column('difficulty', sa.String(), nullable=True),
    sa.Column('duration_minutes', sa.Integer(), nullable=True),
    sa.Column('number_of_questions', sa.Integer(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('created_by', sa.UUID(), nullable=False),
    sa.Column('source_type', sa.String(), nullable=True),
    sa.Column('source_id', sa.UUID(), nullable=True),
    sa.Column('generation_prompt', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quizzes_id'), 'quizzes', ['id'], unique=False)
    op.create_index(op.f('ix_quizzes_created_by'), 'quizzes', ['created_by'], unique=False)

    op.create_table('questions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('quiz_id', sa.UUID(), nullable=False),
    sa.Column('question_text', sa.Text(), nullable=False),
    sa.Column('question_type', sa.String(), nullable=False),
    sa.Column('options', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('correct_answers', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('explanation', sa.Text(), nullable=True),
    sa.Column('difficulty', sa.String(), nullable=True),
    sa.Column('topic', sa.String(), nullable=True),
    sa.Column('points', sa.Integer(), nullable=True),
    sa.Column('order_index', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_questions_id'), 'questions', ['id'], unique=False)
    op.create_index(op.f('ix_questions_quiz_id'), 'questions', ['quiz_id'], unique=False)

    op.create_table('quiz_attempts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('quiz_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('score', sa.Float(), nullable=True),
    sa.Column('total_points', sa.Integer(), nullable=True),
    sa.Column('correct_count', sa.Integer(), nullable=True),
    sa.Column('wrong_count', sa.Integer(), nullable=True),
    sa.Column('skipped_count', sa.Integer(), nullable=True),
    sa.Column('answers', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('time_taken_seconds', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quiz_attempts_id'), 'quiz_attempts', ['id'], unique=False)
    op.create_index(op.f('ix_quiz_attempts_quiz_id'), 'quiz_attempts', ['quiz_id'], unique=False)
    op.create_index(op.f('ix_quiz_attempts_user_id'), 'quiz_attempts', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_quiz_attempts_user_id'), table_name='quiz_attempts')
    op.drop_index(op.f('ix_quiz_attempts_quiz_id'), table_name='quiz_attempts')
    op.drop_index(op.f('ix_quiz_attempts_id'), table_name='quiz_attempts')
    op.drop_table('quiz_attempts')
    op.drop_index(op.f('ix_questions_quiz_id'), table_name='questions')
    op.drop_index(op.f('ix_questions_id'), table_name='questions')
    op.drop_table('questions')
    op.drop_index(op.f('ix_quizzes_created_by'), table_name='quizzes')
    op.drop_index(op.f('ix_quizzes_id'), table_name='quizzes')
    op.drop_table('quizzes')
