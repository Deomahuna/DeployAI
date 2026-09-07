import os
import json
from models.enums import BuildStrategy
from services.dockerfile_generator_service import (
    generate_dockerfile,
    generate_node_static_dockerfile,
    write_dockerfile,
    env,
)

DEFAULT_NODE_VERSION = "20"
DEFAULT_PYTHON_VERSION = "3.11"


def determine_strategy(repo_path: str) -> dict:
    """
    Applique la cascade de détection et retourne un dict décrivant
    la stratégie choisie, prêt à être stocké dans Project.build_config.
    """

    # 1. docker-compose.yml présent
    if os.path.exists(os.path.join(repo_path, "docker-compose.yml")):
        return {"strategy": BuildStrategy.DOCKER_COMPOSE.value}

    # 2. Dockerfile déjà présent à la racine
    if os.path.exists(os.path.join(repo_path, "Dockerfile")):
        return {"strategy": BuildStrategy.EXISTING_DOCKERFILE.value, "dockerfile_path": "Dockerfile"}

    # 3. Node.js détecté
    package_json_path = os.path.join(repo_path, "package.json")
    if os.path.exists(package_json_path):
        return _build_node_config(repo_path, package_json_path)

    # 4. Python détecté
    if os.path.exists(os.path.join(repo_path, "requirements.txt")):
        return _build_python_config(repo_path)

    # 5. Fichiers statiques (au moins un index.html à la racine)
    if os.path.exists(os.path.join(repo_path, "index.html")):
        return _build_static_config()

    # 6. Rien ne matche
    return {"strategy": BuildStrategy.UNDETECTED.value}


def _build_node_config(repo_path: str, package_json_path: str) -> dict:
    with open(package_json_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)

    scripts = pkg.get("scripts", {})
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

    is_frontend_spa = any(dep in deps for dep in ("react", "vue", "vite")) and "next" not in deps

    if is_frontend_spa:
        config = {
            "strategy": BuildStrategy.GENERATED_NODE_STATIC.value,
            "language": "node-static",
            "version": DEFAULT_NODE_VERSION,
            "install_cmd": "npm install",
            "build_cmd": "npm run build",
            "output_dir": "dist" if "vite" in deps else "build",
            "port": 80,
        }
        dockerfile_content = generate_node_static_dockerfile(
            version=config["version"], install_cmd=config["install_cmd"],
            build_cmd=config["build_cmd"], output_dir=config["output_dir"],
        )
        write_dockerfile(repo_path, dockerfile_content)
        return config

    # Sinon : vrai backend Node (Express, Fastify, Next.js en SSR, ou script node simple)
    if "start" in scripts:
        start_cmd = "npm start"
    elif "dev" in scripts:
        start_cmd = "npm run dev"
    else:
        start_cmd = "node index.js"

    port = 3000
    if "next" in deps:
        port = 3000
    elif "express" in deps or "fastify" in deps:
        port = 8080

    config = {
        "strategy": BuildStrategy.GENERATED_NODE.value,
        "language": "node",
        "version": DEFAULT_NODE_VERSION,
        "install_cmd": "npm install",
        "start_cmd": start_cmd,
        "port": port,
    }

    dockerfile_content = generate_dockerfile(
        language="node", version=config["version"],
        install_cmd=config["install_cmd"], start_cmd=config["start_cmd"], port=config["port"],
    )
    write_dockerfile(repo_path, dockerfile_content)
    return config


def _build_python_config(repo_path: str) -> dict:
    start_cmd = "python app.py"
    if os.path.exists(os.path.join(repo_path, "manage.py")):
        start_cmd = "gunicorn --bind 0.0.0.0:8000 wsgi:application"
    elif os.path.exists(os.path.join(repo_path, "main.py")):
        start_cmd = "uvicorn main:app --host 0.0.0.0 --port 8000"

    config = {
        "strategy": BuildStrategy.GENERATED_PYTHON.value,
        "language": "python",
        "version": DEFAULT_PYTHON_VERSION,
        "install_cmd": "pip install -r requirements.txt",
        "start_cmd": start_cmd,
        "port": 8000,
    }

    dockerfile_content = generate_dockerfile(
        language="python", version=config["version"],
        install_cmd=config["install_cmd"], start_cmd=config["start_cmd"], port=config["port"],
    )
    write_dockerfile(repo_path, dockerfile_content)
    return config


def _build_static_config() -> dict:
    return {
        "strategy": BuildStrategy.GENERATED_STATIC.value,
        "language": "static",
        "port": 80,
    }


def regenerate_dockerfile(repo_path: str, build_config: dict) -> None:
    """Recrée le Dockerfile dans le repo fraîchement cloné, à partir d'une config déjà déterminée
    (utile lors d'un redéploiement : le clone est refait à zéro à chaque fois)."""
    content = generate_dockerfile(
        language=build_config["language"],
        version=build_config["version"],
        install_cmd=build_config["install_cmd"],
        start_cmd=build_config["start_cmd"],
        port=build_config["port"],
    )
    write_dockerfile(repo_path, content)


def regenerate_node_static_dockerfile(repo_path: str, build_config: dict) -> None:
    """Recrée le Dockerfile multi-stage (build React/Vue + nginx) dans le repo fraîchement cloné."""
    content = generate_node_static_dockerfile(
        version=build_config["version"],
        install_cmd=build_config["install_cmd"],
        build_cmd=build_config["build_cmd"],
        output_dir=build_config["output_dir"],
    )
    write_dockerfile(repo_path, content)


def write_static_dockerfile(repo_path: str) -> None:
    template = env.get_template("static.dockerfile.j2")
    content = template.render()
    write_dockerfile(repo_path, content)