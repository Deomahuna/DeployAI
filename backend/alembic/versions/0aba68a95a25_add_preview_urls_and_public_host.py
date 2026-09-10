"""add preview_urls and public_host

Revision ID: 0aba68a95a25
Revises: 7c95f5e7e09c
Create Date: 2026-09-11 12:41:10.173821

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0aba68a95a25'
down_revision: Union[str, Sequence[str], None] = '7c95f5e7e09c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Server : adresse publique optionnelle
    op.add_column("servers", sa.Column("public_host", sa.String(), nullable=True))

    # 2. Deployment : nouvelle colonne preview_urls (liste de {label, url})
    op.add_column("deployments", sa.Column("preview_urls", sa.JSON(), nullable=True))

    # 3. Backfill : convertit l'ancienne preview_url (une seule URL) en liste
    #    JSON pour ne pas perdre les données déjà en base.
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            UPDATE deployments
            SET preview_urls = json_build_array(
                json_build_object('label', 'web', 'url', preview_url)
            )
            WHERE preview_url IS NOT NULL
            """
        )
    )

    # 4. Suppression de l'ancienne colonne, une fois le backfill vérifié.
    op.drop_column("deployments", "preview_url")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column("deployments", sa.Column("preview_url", sa.String(), nullable=True))

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            UPDATE deployments
            SET preview_url = preview_urls->0->>'url'
            WHERE preview_urls IS NOT NULL AND json_array_length(preview_urls) > 0
            """
        )
    )

    op.drop_column("deployments", "preview_urls")
    op.drop_column("servers", "public_host")