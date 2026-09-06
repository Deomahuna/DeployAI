"""harmonize project status enum

Revision ID: 13b2997ff215
Revises: 7cbe2e620b9c
Create Date: 2026-09-04 10:09:25.901840

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13b2997ff215'
down_revision: Union[str, Sequence[str], None] = '7cbe2e620b9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE projectstatus RENAME TO projectstatus_old")
    op.execute("CREATE TYPE projectstatus AS ENUM ('pending', 'running', 'success', 'failed')")
    op.execute(
        "ALTER TABLE projects ALTER COLUMN status TYPE projectstatus "
        "USING status::text::projectstatus"
    )
    op.execute("DROP TYPE projectstatus_old")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TYPE projectstatus RENAME TO projectstatus_new")
    op.execute("CREATE TYPE projectstatus AS ENUM ('pending', 'deployed', 'failed')")
    op.execute(
        "ALTER TABLE projects ALTER COLUMN status TYPE projectstatus "
        "USING status::text::projectstatus"
    )
    op.execute("DROP TYPE projectstatus_new")