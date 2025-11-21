from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "xxxx_add_task_options_table"
down_revision = '14a58a591f64'  # alembic сам подставит
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "task_options",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("task_id", sa.Integer(), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_table("task_options")
