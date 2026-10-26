import logging
import os
import shutil
import stat
import subprocess
import time
import zipfile
from datetime import datetime
from sqlalchemy.orm import Session

from models.user import User
from models.project import Project
from models.deployment import Deployment
from models.diagnostic import Diagnostic
from models.server import Server
from models.enums import DeploymentStatus, DiagnosticSeverity, ProjectStatus, BuildStrategy
from repositories import deployment_repository, project_repository
from services import docker_service, ai_service, realtime_service, build_strategy_service
from core.security import decrypt_value
from core.exceptions import DeploymentError, NotFoundError

import tempfile

CLONE_DIR = os.path.join(tempfile.gettempdir(), "deployai_workspace")

logger = logging.getLogger(__name__)


def _remove_readonly(func, path, exc_info):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except PermissionError:
        # Le fichier est encore verrouillé (antivirus, handle process pas relâché) :
        # on laisse _rmtree_with_retry retenter au lieu d'échouer immédiatement.
        pass


def _rmtree_with_retry(path: str, attempts: int = 5, delay: float = 0.4) -> None:
    for attempt in range(attempts):
        try:
            shutil.rmtree(path, onerror=_remove_readonly)
            return
        except (PermissionError, OSError) as exc:
            if attempt == attempts - 1:
                raise DeploymentError(
                    f"Impossible de supprimer l'ancien répertoire de build '{path}' "
                    f"(fichier verrouillé) : {exc}"
                )
            time.sleep(delay * (attempt + 1))


def _git_clone_with_retry(branch: str, repo_url: str, dest: str, retries: int = 3, timeout: int = 30, backoff: float = 2.0):
    """
    Clone avec retry : le réseau de la machine de build semble sujet à des
    coupures intermittentes (timeouts vers github.com). On retente plusieurs
    fois avec un backoff progressif, et on borne chaque tentative avec un
    timeout explicite pour ne pas rester bloqué indéfiniment si git ne
    remonte pas d'erreur clairement.
    """
    last_result = None
    for attempt in range(retries):
        try:
            result = subprocess.run(
                ["git", "clone", "--depth", "1", "--branch", branch, repo_url, dest],
                capture_output=True, text=True, timeout=timeout,
            )
            if result.returncode == 0:
                return result
            last_result = result
        except subprocess.TimeoutExpired:
            last_result = None

        if os.path.exists(dest):
            _rmtree_with_retry(dest)
        if attempt < retries - 1:
            time.sleep(backoff * (attempt + 1))

    if last_result is not None:
        raise DeploymentError(
            f"Échec du clonage du dépôt (branche '{branch}') après {retries} tentatives : "
            f"{last_result.stderr.strip()}"
        )
    raise DeploymentError(
        f"Échec du clonage du dépôt (branche '{branch}') après {retries} tentatives : "
        f"délai dépassé à chaque essai (timeout réseau vers GitHub/GitLab)."
    )


def _prepare_source(project: Project) -> str:
    dest = os.path.join(CLONE_DIR, f"project_{project.id}")
    if os.path.exists(dest):
        _rmtree_with_retry(dest)
    os.makedirs(CLONE_DIR, exist_ok=True)

    if project.repo_url:
        branch = project.branch or "main"
        _git_clone_with_retry(branch, project.repo_url, dest)

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


def _build_preview_urls(server: Server | None, port_mappings: dict) -> list[dict]:
    """
    Transforme les ports mappés (venant soit de build_and_run, soit de
    get_compose_port_mappings) en liste uniforme d'URLs consultables.

    port_mappings accepte deux formats :
    - stratégie directe : { "<container_port>/tcp": "<host_port>", ... }
    - stratégie compose  : { "<service_name>": { "<container_port>/tcp": "<host_port>", ... }, ... }

    Retourne : [{"label": ..., "url": ...}, ...]
    """
    if not port_mappings:
        return []

    host = docker_service.resolve_preview_host(server)
    urls = []

    first_value = next(iter(port_mappings.values()))
    is_compose = isinstance(first_value, dict)

    if is_compose:
        for service_name, ports in port_mappings.items():
            for container_port, host_port in ports.items():
                port_label = container_port.split("/")[0]
                label = service_name if len(ports) == 1 else f"{service_name} ({port_label})"
                urls.append({"label": label, "url": f"http://{host}:{host_port}"})
    else:
        for container_port, host_port in port_mappings.items():
            label = container_port.split("/")[0]
            urls.append({"label": label, "url": f"http://{host}:{host_port}"})

    return urls


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

        # Calculé ICI, avant la génération/régénération du Dockerfile : un
        # frontend statique généré (React/Vite/Vue) a besoin de connaître ces
        # noms de variables pour les déclarer en ARG/ENV dans son Dockerfile,
        # afin de pouvoir les lire PENDANT `npm run build` (elles ne seront
        # plus lisibles une fois le site figé en fichiers statiques servis
        # par nginx, contrairement à un vrai backend qui les lit au runtime).
        env_var_objs = list(project.env_vars)
        env_vars = {v.key: decrypt_value(v.value_encrypted) for v in env_var_objs}

        # Protection réelle, pas juste documentée : une variable marquée
        # "secret" est EXCLUE des build-args pour un frontend statique
        # généré. Sa valeur finirait de toute façon visible en clair dans le
        # JS envoyé au navigateur une fois le site buildé — la bakera au
        # build serait une fausse sécurité. Seules les variables
        # explicitement NON secrètes (destinées à être publiques, ex: une
        # URL d'API) sont éligibles à cette injection build-time.
        public_env_vars = {v.key: decrypt_value(v.value_encrypted) for v in env_var_objs if not v.is_secret}
        public_env_var_keys = list(public_env_vars.keys())

        if project.build_config and project.build_config.get("strategy") not in (None, BuildStrategy.UNDETECTED.value):
            build_config = project.build_config
            if build_config["strategy"] in (BuildStrategy.GENERATED_NODE.value, BuildStrategy.GENERATED_PYTHON.value, BuildStrategy.GENERATED_PHP.value):
                build_strategy_service.regenerate_dockerfile(repo_path, build_config)
            elif build_config["strategy"] == BuildStrategy.GENERATED_NODE_STATIC.value:
                build_strategy_service.regenerate_node_static_dockerfile(repo_path, build_config, env_var_keys=public_env_var_keys)
            elif build_config["strategy"] == BuildStrategy.GENERATED_STATIC.value:
                build_strategy_service.write_static_dockerfile(repo_path)
            elif build_config["strategy"] == BuildStrategy.MANUAL.value:
                build_strategy_service.regenerate_manual_dockerfile(repo_path, build_config)
        else:
            realtime_service.publish_deployment_event(deployment.id, "analyzing", "Détection du type de projet...")
            build_config = build_strategy_service.determine_strategy(repo_path, env_var_keys=public_env_var_keys)
            project.build_config = build_config
            project_repository.save(db, project)

        if build_config["strategy"] == BuildStrategy.UNDETECTED.value:
            raise DeploymentError(
                "Impossible de détecter le type de projet. "
                "Configure manuellement le build dans les paramètres du projet."
            )

        realtime_service.publish_deployment_event(deployment.id, "building", "Construction de l'image Docker...")

        preview_urls: list[dict] = []

        if build_config["strategy"] == BuildStrategy.DOCKER_COMPOSE.value:
            build_logs = docker_service.build_and_run_compose(
                repo_path, project_name=f"deployai-{project.id}", env_vars=env_vars
            )
            client = docker_service.get_docker_client(project.server)
            port_mappings = docker_service.get_compose_port_mappings(client, project_name=f"deployai-{project.id}")
            preview_urls = _build_preview_urls(project.server, port_mappings)
        else:
            client = docker_service.get_docker_client(project.server)
            dockerfile_name = build_config.get("dockerfile_path", "Dockerfile")

            def _on_log(line: str):
                realtime_service.publish_deployment_event(deployment.id, "log", line)

            # Même logique de protection appliquée ici : les build-args
            # transmis à Docker n'incluent les secrets que si la stratégie
            # n'est PAS un frontend statique (là où on sait que le résultat
            # est intégralement public). Pour un Dockerfile personnalisé ou
            # un backend, un vrai secret de build (ex: token de registre
            # privé) reste légitime et n'est pas filtré.
            build_args = public_env_vars if build_config["strategy"] == BuildStrategy.GENERATED_NODE_STATIC.value else env_vars

            _, build_logs, port_mappings = docker_service.build_and_run(
                client,
                repo_path=repo_path,
                image_tag=f"deployai/{project.name.lower().replace(' ', '-')}:latest",
                container_name=f"deployai-{project.id}",
                env_vars=env_vars,
                dockerfile=dockerfile_name,
                on_log=_on_log,
                build_args=build_args,
            )
            preview_urls = _build_preview_urls(project.server, port_mappings)

        deployment.status = DeploymentStatus.SUCCESS
        deployment.logs = build_logs
        deployment.preview_urls = preview_urls
        project.status = ProjectStatus.SUCCESS
        if preview_urls:
            project.url = preview_urls[0]["url"]
        deployment.duration_seconds = int(time.time() - started)
        deployment.finished_at = datetime.utcnow()
        project_repository.save(db, project)
        deployment_repository.save(db, deployment)

        realtime_service.publish_deployment_event(deployment.id, "success", "Déploiement réussi.")
        return deployment

    except Exception as exc:
        # docker_service attache les logs de build accumulés jusqu'au point
        # d'échec sur l'exception elle-même (attribut .logs), car build_logs
        # (la variable locale) ne reçoit sa valeur qu'au `return` normal de
        # build_and_run/build_and_run_compose — qui n'est jamais atteint en
        # cas d'erreur. On récupère donc en priorité les logs attachés à
        # l'exception, avec build_logs comme filet de sécurité.
        captured_logs = getattr(exc, "logs", None) or build_logs

        deployment.status = DeploymentStatus.FAILED
        deployment.logs = captured_logs or str(exc)
        project.status = ProjectStatus.FAILED
        deployment.duration_seconds = int(time.time() - started)
        deployment.finished_at = datetime.utcnow()
        deployment_repository.save(db, deployment)
        project_repository.save(db, project)

        realtime_service.publish_deployment_event(deployment.id, "failed", str(exc))
        realtime_service.publish_deployment_event(deployment.id, "diagnosing", "Analyse de l'erreur par l'IA...")

        # _create_diagnostic ne doit JAMAIS pouvoir faire remonter une exception
        # non gérée ici : on serait déjà dans le except du déploiement, donc une
        # exception ici serait avalée silencieusement par Celery (voir
        # tasks/deployment_tasks.py), laissant le déploiement en FAILED sans
        # aucun diagnostic en base -> 404 sur /deployments/{id}/diagnosis alors
        # que le frontend affiche parfois un texte de fallback trompeur.
        try:
            _create_diagnostic(db, deployment, project, str(exc), captured_logs)
            realtime_service.publish_deployment_event(deployment.id, "diagnosed", "Diagnostic IA prêt.")
        except Exception:
            logger.exception(
                "Échec de la création du diagnostic pour le déploiement %s", deployment.id
            )
            db.rollback()
            _create_minimal_diagnostic_safely(db, deployment)
            realtime_service.publish_deployment_event(
                deployment.id, "diagnosed", "Diagnostic IA indisponible (voir logs serveur)."
            )

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


def _create_minimal_diagnostic_safely(db: Session, deployment: Deployment) -> Diagnostic | None:
    """
    Dernier filet de sécurité : après un échec de _create_diagnostic (quelle
    qu'en soit la cause : Gemini, enum invalide, erreur DB...), on tente
    d'insérer un diagnostic minimal codé en dur, pour qu'un GET
    /deployments/{id}/diagnosis ne renvoie plus jamais 404 après un échec de
    déploiement. Si même ça échoue, on logue et on abandonne proprement sans
    faire planter le reste du flux.
    """
    try:
        diagnostic = Diagnostic(
            deployment_id=deployment.id,
            cause="Le diagnostic automatique a échoué. Consulte les logs du déploiement et du serveur.",
            severity=DiagnosticSeverity.MEDIUM,
            confidence=0.0,
            solutions=[{"title": "Vérifier les logs du déploiement et du worker", "command": None}],
        )
        return deployment_repository.create_diagnostic(db, diagnostic)
    except Exception:
        logger.exception(
            "Échec même du diagnostic minimal de secours pour le déploiement %s", deployment.id
        )
        db.rollback()
        return None


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