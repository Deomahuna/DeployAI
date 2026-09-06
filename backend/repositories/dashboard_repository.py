from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.project import Project
from models.deployment import Deployment
from models.diagnostic import Diagnostic
from models.enums import DeploymentStatus, ProjectStatus


def count_active_projects(db: Session, owner_id: int) -> int:
    return (
        db.query(Project)
        .filter(Project.owner_id == owner_id, Project.status != ProjectStatus.FAILED)
        .count()
    )


def count_deployments_this_month(db: Session, owner_id: int) -> int:
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(Deployment)
        .join(Project)
        .filter(Project.owner_id == owner_id, Deployment.started_at >= start_of_month)
        .count()
    )


def compute_success_rate(db: Session, owner_id: int) -> str:
    total = db.query(Deployment).join(Project).filter(Project.owner_id == owner_id).count()
    if total == 0:
        return "—"
    successes = (
        db.query(Deployment)
        .join(Project)
        .filter(Project.owner_id == owner_id, Deployment.status == DeploymentStatus.SUCCESS)
        .count()
    )
    return f"{round(successes / total * 100)}%"


def count_ai_resolved_errors(db: Session, owner_id: int) -> int:
    return (
        db.query(Diagnostic)
        .join(Deployment)
        .join(Project)
        .filter(Project.owner_id == owner_id, Diagnostic.resolved == True)  # noqa: E712
        .count()
    )


def get_recent_deployments(db: Session, owner_id: int, limit: int = 5) -> list[Deployment]:
    return (
        db.query(Deployment)
        .join(Project)
        .filter(Project.owner_id == owner_id)
        .order_by(Deployment.started_at.desc())
        .limit(limit)
        .all()
    )