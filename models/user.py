# Modèle représentant la table users

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base
from models.project import Project

class User(Base):

    # Nom de la table PostgreSQL
    __tablename__ = "users"

    # Colonnes de la table

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nom = Column(
        String(100)
    )

    email = Column(
        String(150),
        unique=True
    )

    mot_de_passe = Column(
        String(255)
    )

    role = Column(
        String(50)
    )

    date_creation = Column(
        DateTime,
        server_default=func.now()
    )
        # Relation avec les projets
    # Un utilisateur peut avoir plusieurs projets
    projets = relationship(
        "Project",
        back_populates="utilisateur"
    )