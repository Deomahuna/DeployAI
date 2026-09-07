import os
import shutil
import subprocess
import time
import zipfile
from datetime import datetime
from sqlalchemy.orm import Session

from models.user import User
from models.project import Project
from models.deployment import Deployment
from models.diagnostic import Diagnostic
from models.enums import DeploymentStatus, DiagnosticSeverity, ProjectStatus, BuildStrategy
from repositories import deployment_repository, project_repository
from services import docker_service, ai_service, realtime_service, build_strategy_service
from core.security import decrypt_value
from core.exceptions import DeploymentError, NotFoundError

CLONE_DIR = "workspace"


def _prepare_source(project: Project) -> str:
    dest = os.path.join(CLONE_DIR, f"project_{project.id}")
    if os.path.exists(dest):
        shutil.rmtree(dest)
    os.makedirs(CLONE_DIR, exist_ok=True)

    if project.repo_url:
        branch = project.branch or "main"
        result = subprocess.run(
            ["git", "clone", "--depth", "1", "--branch", branch, project.repo_url, dest],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            raise DeploymentError(f"Échec du clonage du dépôt (branche '{branch}') : {result.stderr.strip()}")

        if project.subdirectory:
            target = os.path.join(dest, project.subdirectory.strip("/"))
            if not os.path.isdir(target):
                raise DeploymentError(f"Le sous-dossier '{project.subdirectory}' est introuvable dans le dépôt.")
            return target

        return dest

    if project.local_archive_path:
        os.makedirs(dest, exist_ok=True)
        archive_full_path = project.local_archive_path.lstrip("/")
        with zipfile.ZipFile(archive_full_path, "r") as zf:
            zf.extractall(dest)

        if project.subdirectory:
            target = os.path.join(dest, project.subdirectory.strip("/"))
            if not os.path.isdir(target):
                raise DeploymentError(f"Le sous-dossier '{project.subdirectory}' est introuvable dans l'archive.")
            return target

        return dest

    raise DeploymentError("Aucune source de code disponible pour ce projet.")


def deploy_project(db: Session, project: Project, deployment: Deployment) -> Deployment:
    deployment.status = DeploymentStatus.RUNNING
    deployment = deployment_repository.save(db, deployment)

    project.status = ProjectStatus.RUNNING
    project_repository.save(db, project)
    realtime_service.publish_deployment_event(deployment.id, "running", "Démarrage du déploiement...")

    started = time.time()
    build_logs = ""

    try:
        realtime_service.publish_deployment_event(deployment.id, "cloning", "Récupération du code source...")
        repo_path = _prepare_source(project)

        if project.build_config and project.build_config.get("strategy") not in (None, BuildStrategy.UNDETECTED.value):
            build_config = project.build_config
            if build_config["strategy"] in (BuildStrategy.GENERATED_NODE.value, BuildStrategy.GENERATED_PYTHON.value):
                build_strategy_service.regenerate_dockerfile(repo_path, build_config)
            elif build_config["strategy"] == BuildStrategy.GENERATED_NODE_STATIC.value:
                build_strategy_service.regenerate_node_static_dockerfile(repo_path, build_config)
            elif build_config["strategy"] == BuildStrategy.GENERATED_STATIC.value:
                build_strategy_service.write_static_dockerfile(repo_path)
        else:
            realtime_service.publish_deployment_event(deployment.id, "analyzing", "Détection du type de projet...")
            build_config = build_strategy_service.determine_strategy(repo_path)
            project.build_config = build_config
            project_repository.save(db, project)

        if build_config["strategy"] == BuildStrategy.UNDETECTED.value:
            raise DeploymentError(
                "Impossible de détecter le type de projet. "
                "Configure manuellement le build dans les paramètres du projet."
            )

        realtime_service.publish_deployment_event(deployment.id, "building", "Construction de l'image Docker...")
        env_vars = {v.key: decrypt_value(v.value_encrypted) for v in project.env_vars}

        if build_config["strategy"] == BuildStrategy.DOCKER_COMPOSE.value:
            build_logs = docker_service.build_and_run_compose(repo_path, project_name=f"deployai-{project.id}")
        else:
            client = docker_service.get_docker_client(project.server)
            dockerfile_name = build_config.get("dockerfile_path", "Dockerfile")
            _, build_logs = docker_service.build_and_run(
                client,
                repo_path=repo_path,
                image_tag=f"deployai/{project.name}:latest",
                container_name=f"deployai-{project.id}",
                env_vars=env_vars,
                dockerfile=dockerfile_name,
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

    from tasks.deployment_tasks import run_deployment_task
    new_deployment = deployment_repository.create(
        db, Deployment(project_id=deployment.project_id, status=DeploymentStatus.QUEUED)
    )
    run_deployment_task.delay(deployment.project_id, new_deployment.id)
    return new_deployment