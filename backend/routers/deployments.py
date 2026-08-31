# =====================================================
# Router de gestion des déploiements
# =====================================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import DeploymentCreate
from models.deployment import Deployment
from services.deploy_service import DeployService

router = APIRouter(
    prefix="/deployments",
    tags=["Deployments"]
)
deploy_service = DeployService()


# Lire tous les déploiements
@router.get("/")
def get_deployments(db: Session = Depends(get_db)):

    deployments = db.query(Deployment).all()

    return deployments


# Lire un déploiement
@router.get("/{deployment_id}")
def get_deployment(
    deployment_id: int,
    db: Session = Depends(get_db)
):

    deployment = db.query(Deployment).filter(
        Deployment.id == deployment_id
    ).first()

    return deployment


# Créer un déploiement
@router.post("/")
def create_deployment(
    deployment: DeploymentCreate,
    db: Session = Depends(get_db)
):

   return deploy_service.lancer_deploiement(
    project_id=deployment.project_id,
    db=db
)


# Modifier un déploiement
@router.put("/{deployment_id}")
def update_deployment(
    deployment_id: int
):

    return {
        "message": f"Déploiement {deployment_id} modifié"
    }


# Supprimer un déploiement
@router.delete("/{deployment_id}")
def delete_deployment(
    deployment_id: int
):

    return {
        "message": f"Déploiement {deployment_id} supprimé"
    }