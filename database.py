# Connexion entre FastAPI et PostgreSQL

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://postgres:DieuSaint2026@localhost:5432/deployai"

# Adresse de notre base PostgreSQL DeployAI
# Remplace TON_MOT_DE_PASSE par ton vrai mot de passe PostgreSQL


# Création de la connexion
engine = create_engine(DATABASE_URL)


# Création des sessions pour communiquer avec la base
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Base utilisée par les modèles
Base = declarative_base()


# Fonction pour obtenir une connexion à la base
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()