# Connexion entre FastAPI et PostgreSQL

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Charge les variables du fichier .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL n'est pas défini. "
        "Crée un fichier .env dans backend/ "
        "(voir .env.example)."
    )

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