import os
import json
from models.enums import BuildStrategy
from core.exceptions import DeploymentError
from services.dockerfile_generator_service import (
    generate_dockerfile,
    generate_node_static_dockerfile,
    write_dockerfile,
    env,
)

DEFAULT_NODE_VERSION = "20"
DEFAULT_PYTHON_VERSION = "3.11"
DEFAULT_PHP_VERSION = "8.3"


def determine_strategy(repo_path: str, env_var_keys: list[str] | None = None) -> dict:
    """
    Applique la cascade de détection et retourne un dict décrivant
    la stratégie choisie, prêt à être stocké dans Project.build_config.

    env_var_keys : noms des variables d'environnement définies sur le projet
    (pas les valeurs). Utilisé uniquement pour la stratégie de frontend
    statique généré, afin que le Dockerfile déclare les ARG/ENV nécessaires
    pour recevoir ces variables au moment du build (voir
    dockerfile_generator_service.generate_node_static_dockerfile).
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
        return _build_node_config(repo_path, package_json_path, env_var_keys=env_var_keys)

    # 4. Python détecté
    if os.path.exists(os.path.join(repo_path, "requirements.txt")):
        return _build_python_config(repo_path)

    # 4b. PHP détecté (Composer)
    if os.path.exists(os.path.join(repo_path, "composer.json")):
        return _build_php_config(repo_path)

    # 5. Fichiers statiques (au moins un index.html à la racine)
    if os.path.exists(os.path.join(repo_path, "index.html")):
        return _build_static_config()

    # 6. Rien ne matche
    return {"strategy": BuildStrategy.UNDETECTED.value}


def _build_node_config(repo_path: str, package_json_path: str, env_var_keys: list[str] | None = None) -> dict:
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
            build_arg_keys=env_var_keys,
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


def _build_php_config(repo_path: str) -> dict:
    # Serveur de développement intégré à PHP (`php -S`) : suffisant pour un
    # déploiement de test/preview, contrairement à un vrai serveur de prod
    # (Apache/nginx + PHP-FPM). À ajuster manuellement via le mode "J'ai
    # déjà mon propre Dockerfile" si un déploiement de production est visé.
    start_cmd = "php -S 0.0.0.0:8000"
    if os.path.isdir(os.path.join(repo_path, "public")):
        start_cmd = "php -S 0.0.0.0:8000 -t public"

    config = {
        "strategy": BuildStrategy.GENERATED_PHP.value,
        "language": "php",
        "version": DEFAULT_PHP_VERSION,
        "install_cmd": "composer install --no-interaction --prefer-dist",
        "start_cmd": start_cmd,
        "port": 8000,
    }

    dockerfile_content = generate_dockerfile(
        language="php", version=config["version"],
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


def regenerate_node_static_dockerfile(repo_path: str, build_config: dict, env_var_keys: list[str] | None = None) -> None:
    """
    Recrée le Dockerfile multi-stage (build React/Vue + nginx) dans le repo
    fraîchement cloné. env_var_keys est relu à chaque redéploiement (pas
    stocké dans build_config) pour que l'ajout/suppression d'une variable
    d'environnement sur le projet soit pris en compte sans devoir tout
    reconfigurer manuellement.
    """
    content = generate_node_static_dockerfile(
        version=build_config["version"],
        install_cmd=build_config["install_cmd"],
        build_cmd=build_config["build_cmd"],
        output_dir=build_config["output_dir"],
        build_arg_keys=env_var_keys,
    )
    write_dockerfile(repo_path, content)


def regenerate_manual_dockerfile(repo_path: str, build_config: dict) -> None:
    """
    Câble réellement la stratégie 'manual' (jusqu'ici configurable depuis
    l'UI /projects/:id/build-config, mais jamais utilisée au moment du
    build — aucune branche de deploy_project ne la traitait, donc le
    Dockerfile attendu n'existait jamais). Deux sous-cas, distingués par la
    présence ou non de 'dockerfile_path' dans build_config :

    1. dockerfile_path renseigné : l'utilisateur a son propre Dockerfile déjà
       présent dans le dépôt, à un chemin/nom personnalisé (ex:
       "backend/Dockerfile.prod"). Rien à générer — on vérifie juste qu'il
       existe bien, pour un message d'erreur clair plutôt qu'un échec Docker
       cryptique en aval.
    2. Sinon : génération à partir du langage/version/commandes saisis dans
       le formulaire, en réutilisant le même générateur que les stratégies
       auto-détectées GENERATED_NODE/GENERATED_PYTHON/GENERATED_STATIC.
    """
    dockerfile_path = build_config.get("dockerfile_path")

    if dockerfile_path:
        full_path = os.path.join(repo_path, dockerfile_path)
        if not os.path.isfile(full_path):
            raise DeploymentError(
                f"Le Dockerfile personnalisé '{dockerfile_path}' est introuvable dans le dépôt "
                f"(vérifie le chemin dans les paramètres du projet)."
            )
        return

    language = build_config.get("language")

    if language == "static":
        write_static_dockerfile(repo_path)
        return

    if language not in ("node", "python", "php"):
        raise DeploymentError(
            f"Langage '{language}' non pris en charge pour une configuration manuelle. "
            f"Utilise node, python, php, static, ou renseigne un chemin de Dockerfile personnalisé."
        )

    content = generate_dockerfile(
        language=language,
        version=build_config.get("version", ""),
        install_cmd=build_config.get("install_cmd", ""),
        start_cmd=build_config.get("start_cmd", ""),
        port=build_config.get("port") or 8080,
    )
    write_dockerfile(repo_path, content)


def write_static_dockerfile(repo_path: str) -> None:
    template = env.get_template("static.dockerfile.j2")
    content = template.render()
    write_dockerfile(repo_path, content)