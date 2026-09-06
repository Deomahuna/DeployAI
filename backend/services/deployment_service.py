import os
import shutil
import subprocess
import time
from datetime import datetime
from sqlalchemy.orm import Session

from models.user import User
from models.project import Project
from models.deployment import Deployment
from models.diagnostic import Diagnostic
from models.enums import DeploymentStatus, DiagnosticSeverity, ProjectStatus
from repositories import deployment_repository, project_repository
from services import docker_service, ai_service, realtime_service
from core.security import decrypt_value
from core.exceptions import DeploymentError, NotFoundError

CLONE_DIR = "workspace"


def _clone_repo(repo_url: str, project_id: int) -> str:
    dest = os.path.join(CLONE_DIR, f"project_{project_id}")
    if os.path.exists(dest):
        shutil.rmtree(dest)
    os.makedirs(CLONE_DIR, exist_ok=True)

    result = subprocess.run(
        ["git", "clone", "--depth", "1", repo_url, dest],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise DeploymentError(f"Échec du clonage du dépôt : {result.stderr.strip()}")
    return dest


def deploy_project(db: Session, project: Project) -> Deployment:
    deployment = deployment_repository.get_latest_queued(db, project.id)
    if deployment:
        deployment.status = DeploymentStatus.RUNNING
        deployment = deployment_repository.save(db, deployment)
    else:
        deployment = deployment_repository.create(
            db, Deployment(project_id=project.id, status=DeploymentStatus.RUNNING)
        )

    project.status = ProjectStatus.RUNNING
    project_repository.save(db, project)
    realtime_service.publish_deployment_event(deployment.id, "running", "Démarrage du déploiement...")

    started = time.time()
    build_logs = ""

    try:
        realtime_service.publish_deployment_event(deployment.id, "cloning", "Clonage du dépôt...")
        repo_path = _clone_repo(project.repo_url, project.id)

        realtime_service.publish_deployment_event(deployment.id, "building", "Construction de l'image Docker...")
        client = docker_service.get_docker_client(project.server)
        env_vars = {v.key: decrypt_value(v.value_encrypted) for v in project.env_vars}

        _, build_logs = docker_service.build_and_run(
            client,
            repo_path=repo_path,
            image_tag=f"deployai/{project.name}:latest",
            container_name=f"deployai-{project.id}",
            env_vars=env_vars,
        )

        deployment.status = DeploymentStatus.SUCCESS
        deployment.logs = build_logs
        project.status = ProjectStatus.SUCCESS
        deployment.duration_seconds = int(time.time() - started)
        deployment.finished_at = datetime.utcnow()
        project_repository.save(db, project)
        deployment_repository.save(db, deployment)

        realtime_service.publish_deployment_event(deployment.id, "success", "Déploiement réussi.")
        return deployment

    except Exception as exc:
        deployment.status = DeploymentStatus.FAILED
        deployment.logs = str(exc)
        project.status = ProjectStatus.FAILED
        deployment.duration_seconds = int(time.time() - started)
        deployment.finished_at = datetime.utcnow()
        deployment_repository.save(db, deployment)
        project_repository.save(db, project)

        realtime_service.publish_deployment_event(deployment.id, "failed", str(exc))

        realtime_service.publish_deployment_event(deployment.id, "diagnosing", "Analyse de l'erreur par l'IA...")
        _create_diagnostic(db, deployment, project, str(exc), build_logs)
        realtime_service.publish_deployment_event(deployment.id, "diagnosed", "Diagnostic IA prêt.")

        return deployment


def _create_diagnostic(db: Session, deployment: Deployment, project: Project, error_message: str, logs: str) -> Diagnostic:
    result = ai_service.analyze_deployment_error(
        error_message=error_message,
        logs=logs,
        language=project.language,
        framework=project.framework,
    )

    diagnostic = Diagnostic(
        deployment_id=deployment.id,
        cause=result["cause"],
        severity=DiagnosticSeverity(result["severity"]),
        confidence=result["confidence"],
        solutions=result["solutions"],
    )
    return deployment_repository.create_diagnostic(db, diagnostic)


def list_deployments(db: Session, current_user: User, project_id: int | None) -> list[Deployment]:
    return deployment_repository.get_all_by_owner(db, current_user.id, project_id)


def _get_owned_deployment(db: Session, current_user: User, deployment_id: int) -> Deployment:
    deployment = deployment_repository.get_by_id(db, deployment_id)
    if not deployment or deployment.project.owner_id != current_user.id:
        raise NotFoundError("Déploiement")
    return deployment


def get_diagnosis(db: Session, current_user: User, deployment_id: int) -> Diagnostic:
    deployment = _get_owned_deployment(db, current_user, deployment_id)
    diagnostic = deployment_repository.get_diagnostic_by_deployment(db, deployment.id)
    if not diagnostic:
        raise NotFoundError("Diagnostic")
    return diagnostic


def resolve_and_redeploy(db: Session, current_user: User, deployment_id: int) -> Deployment:
    deployment = _get_owned_deployment(db, current_user, deployment_id)
    diagnostic = deployment_repository.get_diagnostic_by_deployment(db, deployment.id)
    if diagnostic:
        diagnostic.resolved = True
        diagnostic.resolved_at = datetime.utcnow()
        db.commit()
    return deploy_project(db, deployment.project)