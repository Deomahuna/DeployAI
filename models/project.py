# Modèle représentant la table projects

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Project(Base):

    # Nom de la table PostgreSQL
    __tablename__ = "projects"

    # Colonnes de la table

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nom_projet = Column(
        String(100)
    )

    langage = Column(
        String(50)
    )

    framework = Column(
        String(50)
    )

    description = Column(
        Text
    )

    github_url = Column(
        String(255)
    )

    version = Column(
        String(20)
    )

    statut = Column(
        String(50)
    )

    date_creation = Column(
        DateTime,
        server_default=func.now()
    )

    # Clé étrangère vers l'utilisateur propriétaire du projet
    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    # Relation avec User
    utilisateur = relationship(
        "User",
        back_populates="projets"
    )