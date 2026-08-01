"""create documents and chunks tables

Revision ID: 845f6b4dc5f2
Revises: 36e7ac92fe7e
Create Date: 2026-07-28 13:08:30.301815

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '845f6b4dc5f2'
down_revision: Union[str, Sequence[str], None] = '36e7ac92fe7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS vector;')
    
    op.create_table(
        'documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('file_type', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)

    # Need to import pgvector.sqlalchemy types
    from pgvector.sqlalchemy import Vector
    op.create_table(
        'document_chunks',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('embedding', Vector(dim=768), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_chunks_id'), 'document_chunks', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_document_chunks_id'), table_name='document_chunks')
    op.drop_table('document_chunks')
    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    op.drop_table('documents')
    op.execute('DROP EXTENSION IF EXISTS vector;')
