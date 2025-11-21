"""add selected_option_id to task_completions

Revision ID: add_selected_option_id
Revises: cbd2fad0ff5e
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_selected_option_id'
down_revision = 'xxxx_add_task_options_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем столбец selected_option_id в таблицу task_completions
    op.add_column('task_completions', 
                  sa.Column('selected_option_id', sa.Integer(), nullable=True))
    # Добавляем внешний ключ на task_options
    op.create_foreign_key(
        'fk_task_completions_selected_option_id',
        'task_completions', 'task_options',
        ['selected_option_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Удаляем внешний ключ
    op.drop_constraint('fk_task_completions_selected_option_id', 'task_completions', type_='foreignkey')
    # Удаляем столбец
    op.drop_column('task_completions', 'selected_option_id')

