"""
Script one-shot pour synchroniser les enums PostgreSQL avec les
définitions Python dans models/enums.py.

Usage :
    python scripts/fix_enums.py
"""

import sys
import os

# Permet d'importer les modules du projet (database, models) depuis ce script
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine
from models.enums import ProjectStatus, DeploymentStatus, DiagnosticSeverity


def sync_enum(pg_type_name: str, python_enum) -> None:
    """Ajoute en base les valeurs manquantes d'un enum Python."""
    with engine.connect() as conn:
        # IMPORTANT : ALTER TYPE ... ADD VALUE doit être exécuté hors transaction
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")

        for member in python_enum:
            value_name = member.name  # SQLAlchemy stocke le NOM du membre, pas .value
            print(f"  -> Ajout de '{value_name}' dans {pg_type_name} (si absent)...")
            conn.execute(
                text(f"ALTER TYPE {pg_type_name} ADD VALUE IF NOT EXISTS :val").bindparams(val=value_name)
            )
    print(f"OK: {pg_type_name} synchronisé.\n")


def show_enum(pg_type_name: str) -> None:
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT enum_range(NULL::{pg_type_name})")).scalar()
        print(f"  {pg_type_name} -> {result}")


if __name__ == "__main__":
    print("=== État avant correction ===")
    show_enum("projectstatus")
    show_enum("deploymentstatus")
    show_enum("diagnosticseverity")

    print("\n=== Synchronisation ===")
    sync_enum("projectstatus", ProjectStatus)
    sync_enum("deploymentstatus", DeploymentStatus)
    sync_enum("diagnosticseverity", DiagnosticSeverity)

    print("=== État après correction ===")
    show_enum("projectstatus")
    show_enum("deploymentstatus")
    show_enum("diagnosticseverity")

    print("\nTerminé.")