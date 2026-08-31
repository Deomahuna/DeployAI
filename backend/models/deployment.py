# Modèle représentant la table deployments

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from database import Base


class Deployment(Base):

    # Nom de la table PostgreSQL
    __tablename__ = "deployments"

    # Identifiant du déploiement
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Projet concerné
    project_id = Column(
        Integer
    )

    # Environnement (test, production...)
    environnement = Column(
        String(30)
    )

    # Etat du déploiement
    statut = Column(
        String(20)
    )

    # Date de début
    debut = Column(
        DateTime,
        server_default=func.now()
    )

    # Date de fin
    fin = Column(
        DateTime
    )

    # Durée en secondes
    duree = Column(
        Integer
    )

    # Logs du déploiement
    logs = Column(
        Text
    )