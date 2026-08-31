# =====================================================
# Dashboard de DeployAI
# Affiche les statistiques générales de la plateforme
# =====================================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db

from models.user import User
from models.project import Project
from models.deployment import Deployment
from models.diagnostic import Diagnostic


# Création du routeur
router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# =====================================================
# Tableau de bord
# =====================================================

@router.get("/")
def dashboard(db: Session = Depends(get_db)):

    # Nombre total d'utilisateurs
    nb_users = db.query(func.count(User.id)).scalar()

    # Nombre total de projets
    nb_projects = db.query(func.count(Project.id)).scalar()

    # Nombre total de déploiements
    nb_deployments = db.query(func.count(Deployment.id)).scalar()

    # Nombre total de diagnostics
    nb_diagnostics = db.query(func.count(Diagnostic.id)).scalar()

    # Résultat retourné
    return {

        "utilisateurs": nb_users,

        "projets": nb_projects,

        "deployements": nb_deployments,

        "diagnostics": nb_diagnostics

    }