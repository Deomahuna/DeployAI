import docker
from models.server import Server


def get_docker_client(server: Server | None = None) -> docker.DockerClient:
    host = server.docker_host_url if server else "unix:///var/run/docker.sock"
    return docker.DockerClient(base_url=host)


def build_and_run(client: docker.DockerClient, repo_path: str, image_tag: str, container_name: str, env_vars: dict):
    image, build_log_chunks = client.images.build(path=repo_path, tag=image_tag, rm=True)
    logs_text = "\n".join(chunk.get("stream", "") for chunk in build_log_chunks if "stream" in chunk)

    # Nettoyage d'un ancien conteneur du même nom avant de relancer
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