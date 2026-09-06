from sqlalchemy.orm import Session
from models.deployment import Deployment
from models.diagnostic import Diagnostic
from models.project import Project
from models.enums import DeploymentStatus


def create(db: Session, deployment: Deployment) -> Deployment:
    db.add(deployment)
    return save(db, deployment)


def save(db: Session, deployment: Deployment) -> Deployment:
    db.commit()
    db.refresh(deployment)
    return deployment


def get_by_id(db: Session, deployment_id: int) -> Deployment | None:
    return db.query(Deployment).filter(Deployment.id == deployment_id).first()


def get_latest_queued(db: Session, project_id: int) -> Deployment | None:
    return (
        db.query(Deployment)
        .filter(Deployment.project_id == project_id, Deployment.status == DeploymentStatus.QUEUED)
        .order_by(Deployment.started_at.desc())
        .first()
    )


def get_all_by_owner(db: Session, owner_id: int, project_id: int | None = None) -> list[Deployment]:
    query = db.query(Deployment).join(Project).filter(Project.owner_id == owner_id)
    if project_id:
        query = query.filter(Deployment.project_id == project_id)
    return query.order_by(Deployment.started_at.desc()).all()


def create_diagnostic(db: Session, diagnostic: Diagnostic) -> Diagnostic:
    db.add(diagnostic)
    db.commit()
    db.refresh(diagnostic)
    return diagnostic


def get_diagnostic_by_deployment(db: Session, deployment_id: int) -> Diagnostic | None:
    return db.query(Diagnostic).filter(Diagnostic.deployment_id == deployment_id).first()