from sqlalchemy.orm import Session
from models.user import User
from models.project import Project
from models.deployment import Deployment
from models.env_var import EnvVar
from models.enums import DeploymentStatus, ProjectStatus
from schemas.project import ProjectCreate, EnvVarCreate, ProjectStats
from repositories import project_repository, deployment_repository
from core.security import encrypt_value, decrypt_value
from core.exceptions import NotFoundError
from tasks.deployment_tasks import run_deployment_task


def _ensure_owner(project: Project | None, current_user: User) -> Project:
    if not project or project.owner_id != current_user.id:
        raise NotFoundError("Projet")
    return project


def list_projects(db: Session, current_user: User) -> list[Project]:
    return project_repository.get_all_by_owner(db, current_user.id)


def get_project(db: Session, project_id: int, current_user: User) -> Project:
    project = project_repository.get_by_id(db, project_id)
    return _ensure_owner(project, current_user)


def compute_stats(project: Project) -> ProjectStats:
    deployments = project.deployments
    total = len(deployments)
    if total == 0:
        return ProjectStats(total=0, success_rate="—", avg_build_seconds=None)

    successes = [d for d in deployments if d.status == DeploymentStatus.SUCCESS]
    success_rate = f"{round(len(successes) / total * 100)}%"

    durations = [d.duration_seconds for d in deployments if d.duration_seconds]
    avg_build = sum(durations) / len(durations) if durations else None

    return ProjectStats(total=total, success_rate=success_rate, avg_build_seconds=avg_build)


def import_project(db: Session, current_user: User, payload: ProjectCreate) -> Project:
    project = Project(
        name=payload.name,
        repo_url=payload.repo_url,
        provider=payload.provider,
        repo_id=payload.repo_id,
        language=payload.language,
        framework=payload.framework,
        dependencies_summary=payload.dependencies_summary,
        status=ProjectStatus.PENDING,
        owner_id=current_user.id,
    )
    return project_repository.create(db, project)


def delete_project(db: Session, project_id: int, current_user: User) -> None:
    project = get_project(db, project_id, current_user)
    project_repository.delete(db, project)


def add_env_var(db: Session, project_id: int, current_user: User, payload: EnvVarCreate) -> EnvVar:
    project = get_project(db, project_id, current_user)
    env_var = EnvVar(
        project_id=project.id,
        key=payload.key,
        value_encrypted=encrypt_value(payload.value),
        is_secret=payload.is_secret,
    )
    return project_repository.add_env_var(db, env_var)


def remove_env_var(db: Session, project_id: int, current_user: User, key: str) -> None:
    project = get_project(db, project_id, current_user)
    env_var = project_repository.get_env_var(db, project.id, key)
    if not env_var:
        raise NotFoundError("Variable d'environnement", key)
    project_repository.delete_env_var(db, env_var)


def get_decrypted_env_vars(project: Project) -> list[dict]:
    return [
        {"key": v.key, "value": decrypt_value(v.value_encrypted), "is_secret": v.is_secret}
        for v in project.env_vars
    ]


def deploy(db: Session, project_id: int, current_user: User) -> Deployment:
    project = get_project(db, project_id, current_user)

    deployment = deployment_repository.create(
        db, Deployment(project_id=project.id, status=DeploymentStatus.QUEUED)
    )

    run_deployment_task.delay(project.id)
    return deployment