from fastapi import Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.deployment import DeploymentOut, DiagnosticOut
from core.security import get_current_user
from services import deployment_service


def list_deployments(
    project_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DeploymentOut]:
    return deployment_service.list_deployments(db, current_user, project_id)


def get_diagnosis(
    deployment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DiagnosticOut:
    return deployment_service.get_diagnosis(db, current_user, deployment_id)


def resolve_diagnostic(
    deployment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deployment_service.resolve_and_redeploy(db, current_user, deployment_id)
    return {"message": "Résolu, redéploiement lancé."}