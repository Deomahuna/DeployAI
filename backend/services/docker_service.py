import os
import platform
import subprocess
from urllib.parse import urlparse

import docker
from models.server import Server
from core.exceptions import DeploymentError


def _default_docker_host() -> str:
    if platform.system() == "Windows":
        return "npipe:////./pipe/docker_engine"
    return "unix:///var/run/docker.sock"


def get_docker_client(server: Server | None = None) -> docker.DockerClient:
    host = server.docker_host_url if server else _default_docker_host()
    return docker.DockerClient(base_url=host)


def resolve_preview_host(server: Server | None) -> str:
    """
    Détermine le hostname à utiliser pour les URLs de preview d'un déploiement.

    Ordre de priorité :
    1. server.public_host, si renseigné explicitement (le cas le plus fiable :
       le démon Docker peut tourner sur une IP privée/VPN différente de
       l'adresse publique par laquelle l'app doit être consultée).
    2. Le hostname déduit de docker_host_url si c'est une connexion réseau
       (tcp:// / http(s)://) — meilleur effort si public_host n'est pas défini.
    3. localhost — pas de serveur, ou socket local (unix:// / npipe://) :
       le conteneur tourne sur la même machine que le backend.
    """
    if not server:
        return "localhost"

    if server.public_host:
        return server.public_host

    parsed = urlparse(server.docker_host_url)
    if parsed.scheme in ("tcp", "http", "https") and parsed.hostname:
        return parsed.hostname

    return "localhost"


def build_and_run(client: docker.DockerClient, repo_path: str, image_tag: str, container_name: str, env_vars: dict, dockerfile: str = "Dockerfile", on_log=None):
    logs_lines = []

    def _emit(line: str):
        line = line.rstrip("\n")
        if not line:
            return
        logs_lines.append(line)
        if on_log:
            on_log(line)

    # API bas niveau : renvoie un générateur, streamé au fur et à mesure du build
    raw_stream = client.api.build(
        path=repo_path,
        dockerfile=dockerfile,
        tag=image_tag,
        rm=True,
        decode=True,
    )

    image_id = None
    for chunk in raw_stream:
        if "stream" in chunk:
            _emit(chunk["stream"])
        elif "error" in chunk:
            _emit(f"ERROR: {chunk['error']}")
            raise DeploymentError(chunk["error"].strip())
        elif "aux" in chunk and "ID" in chunk.get("aux", {}):
            image_id = chunk["aux"]["ID"]

    if not image_id:
        try:
            image_id = client.images.get(image_tag).id
        except docker.errors.ImageNotFound:
            raise DeploymentError("Le build Docker n'a produit aucune image (voir logs).")

    image = client.images.get(image_id)
    logs_text = "\n".join(logs_lines)

    try:
        old = client.containers.get(container_name)
        old.stop()
        old.remove()
    except docker.errors.NotFound:
        pass

    exposed_ports = image.attrs.get("Config", {}).get("ExposedPorts", {})
    if not exposed_ports:
        raise DeploymentError(
            "Aucun port EXPOSE trouvé dans l'image. Ajoute une instruction EXPOSE dans le Dockerfile."
        )

    port_bindings = {port: None for port in exposed_ports}

    container = client.containers.run(
        image=image.id,
        name=container_name,
        environment=env_vars,
        ports=port_bindings,
        detach=True,
    )
    container.reload()

    # Tous les ports mappés, pas seulement le premier : { "3000/tcp": "32768", ... }
    host_ports = {}
    for port, bindings in (container.attrs["NetworkSettings"]["Ports"] or {}).items():
        if bindings:
            host_ports[port] = bindings[0]["HostPort"]

    if not host_ports:
        raise DeploymentError("Le conteneur a démarré mais aucun port n'a été mappé côté hôte.")

    return container, logs_text, host_ports


def build_and_run_compose(repo_path: str, project_name: str) -> str:
    result = subprocess.run(
        ["docker", "compose", "-p", project_name, "up", "-d", "--build"],
        cwd=repo_path, capture_output=True, text=True,
    )
    output = (result.stdout or "") + (result.stderr or "")
    if result.returncode != 0:
        raise DeploymentError(f"Échec docker-compose : {result.stderr.strip()[:1000]}")
    return output


def get_compose_port_mappings(client: docker.DockerClient, project_name: str) -> dict:
    """
    Inspecte les conteneurs démarrés par `docker compose -p <project_name> up`
    et retourne leurs ports mappés, groupés par nom de service.

    Format : { "<service_name>": { "<container_port>/tcp": "<host_port>", ... }, ... }

    Sans ça, une stratégie DOCKER_COMPOSE ne produit aucune preview_url :
    build_and_run_compose ne renvoie que des logs texte, jamais les ports.
    """
    containers = client.containers.list(
        filters={"label": f"com.docker.compose.project={project_name}"}
    )
    mappings = {}
    for container in containers:
        container.reload()
        service = container.labels.get("com.docker.compose.service", container.name)
        ports = {}
        for port, bindings in (container.attrs["NetworkSettings"]["Ports"] or {}).items():
            if bindings:
                ports[port] = bindings[0]["HostPort"]
        if ports:
            mappings[service] = ports
    return mappings