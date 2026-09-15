import json
import os
from jinja2 import Environment, FileSystemLoader

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates", "dockerfiles")
env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

TEMPLATE_BY_LANGUAGE = {
    "node": "node.dockerfile.j2",
    "node-static": "node_static.dockerfile.j2",
    "python": "python.dockerfile.j2",
    "php": "php.dockerfile.j2",
    "static": "static.dockerfile.j2",
}


def generate_dockerfile(language: str, version: str = "", install_cmd: str = "", start_cmd: str = "", port: int = 8080) -> str:
    template_name = TEMPLATE_BY_LANGUAGE.get(language)
    if not template_name:
        raise ValueError(f"Pas de template Dockerfile pour le langage '{language}'.")

    template = env.get_template(template_name)

    # start_cmd doit être une commande shell simple type "npm start" —
    # on la transforme en liste JSON pour la forme CMD ["npm", "start"] du Dockerfile
    start_cmd_json = ", ".join(json.dumps(part) for part in start_cmd.split()) if start_cmd else ""

    return template.render(
        version=version,
        install_cmd=install_cmd,
        start_cmd_json=start_cmd_json,
        port=port,
    )


def write_dockerfile(repo_path: str, content: str) -> str:
    dockerfile_path = os.path.join(repo_path, "Dockerfile")
    with open(dockerfile_path, "w", encoding="utf-8") as f:
        f.write(content)
    return dockerfile_path


def generate_node_static_dockerfile(
    version: str,
    install_cmd: str,
    build_cmd: str,
    output_dir: str,
    build_arg_keys: list[str] | None = None,
) -> str:
    """
    build_arg_keys : noms (pas les valeurs) des variables d'environnement du
    projet à déclarer comme ARG/ENV dans l'étape de build du Dockerfile
    multi-stage généré. Nécessaire pour qu'un frontend statique (React/Vite/
    Vue) puisse lire ces variables PENDANT `npm run build` — un site déjà
    buildé en fichiers statiques ne peut plus les lire au runtime, une fois
    servi par nginx. Les valeurs réelles sont fournies séparément via
    `buildargs` au moment de `docker build` (voir docker_service.build_and_run).
    """
    template = env.get_template("node_static.dockerfile.j2")
    return template.render(
        version=version,
        install_cmd=install_cmd,
        build_cmd=build_cmd,
        output_dir=output_dir,
        build_arg_keys=build_arg_keys or [],
    )