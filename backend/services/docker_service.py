import os
import platform
import subprocess
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


def build_and_run(client: docker.DockerClient, repo_path: str, image_tag: str, container_name: str, env_vars: dict, dockerfile: str = "Dockerfile"):
    image, build_log_chunks = client.images.build(path=repo_path, dockerfile=dockerfile, tag=image_tag, rm=True)
    logs_text = "\n".join(chunk.get("stream", "") for chunk in build_log_chunks if "stream" in chunk)

    try:
        old = client.containers.get(container_name)
        old.stop()
        old.remove()
    except docker.errors.NotFound:
        pass

    container = client.containers.run(
        image=image.id,
        name=container_name,
        environment=env_vars,
        detach=True,
    )
    return container, logs_text


def build_and_run_compose(repo_path: str, project_name: str) -> str:
    result = subprocess.run(
        ["docker", "compose", "-p", project_name, "up", "-d", "--build"],
        cwd=repo_path, capture_output=True, text=True,
    )
    output = (result.stdout or "") + (result.stderr or "")
    if result.returncode != 0:
        raise DeploymentError(f"Échec docker-compose : {result.stderr.strip()[:1000]}")
    return output