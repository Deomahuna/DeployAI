# Modèle représentant la table diagnostics

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from database import Base


class Diagnostic(Base):

    # Nom de la table PostgreSQL
    __tablename__ = "diagnostics"


    # Identifiant du diagnostic
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    # Déploiement concerné
    deployment_id = Column(
        Integer
    )


    # Type d'erreur détectée
    type_erreur = Column(
        String(100)
    )


    # Message complet de l'erreur
    erreur = Column(
        Text
    )


    # Solution proposée par l'IA
    solution = Column(
        Text
    )


    # Niveau de gravité
    gravite = Column(
        String(20)
    )


    # Date de l'analyse
    date_analyse = Column(
        DateTime,
        server_default=func.now()
    )