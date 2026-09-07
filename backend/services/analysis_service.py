import os
import json
import shutil
import stat
import subprocess
import time
from core.exceptions import DeploymentError

CLONE_DIR = "workspace/analysis"


def _remove_readonly(func, path, _exc_info):
    """Callback pour shutil.rmtree — Git marque certains fichiers .git en lecture seule sous Windows."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


def _safe_rmtree(path: str, retries: int = 6, delay: float = 0.5) -> None:
    for attempt in range(retries):
        try:
            shutil.rmtree(path, onerror=_remove_readonly)
            return
        except (PermissionError, OSError):
            if attempt == retries - 1:
                # Dernier recours : on abandonne la suppression plutôt que de faire planter l'analyse.
                # Le prochain nettoyage (nouvelle analyse) réessaiera sur ce même dossier.
                return
            time.sleep(delay)

def _clone_for_analysis(repo_url: str, branch: str = "main") -> str:
    dest = os.path.join(CLONE_DIR, "tmp_analysis")
    if os.path.exists(dest):
        _safe_rmtree(dest)
    os.makedirs(CLONE_DIR, exist_ok=True)

    result = subprocess.run(
        ["git", "clone", "--depth", "1", "--branch", branch, repo_url, dest],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise DeploymentError(f"Impossible de cloner le dépôt : {result.stderr.strip()}")
    return dest


def _count_dependencies(path: str, filename: str) -> int:
    filepath = os.path.join(path, filename)
    if not os.path.exists(filepath):
        return 0
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        lines = [l.strip() for l in f.readlines() if l.strip() and not l.startswith("#")]
    return len(lines)


def analyze_repo(repo_url: str, branch: str = "main", subdirectory: str = None) -> dict:
    path = _clone_for_analysis(repo_url, branch)
    if subdirectory:
        path = os.path.join(path, subdirectory.strip("/"))
        if not os.path.isdir(path):
            raise DeploymentError(f"Le sous-dossier '{subdirectory}' est introuvable.")

    try:
        if os.path.exists(os.path.join(path, "requirements.txt")):
            count = _count_dependencies(path, "requirements.txt")
            framework = "FastAPI" if os.path.exists(os.path.join(path, "main.py")) else None
            return {
                "language": "Python",
                "framework": framework,
                "dependencies_summary": f"requirements.txt ({count})",
            }

        if os.path.exists(os.path.join(path, "package.json")):
            with open(os.path.join(path, "package.json")) as f:
                pkg = json.load(f)
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            framework = None
            if "next" in deps:
                framework = "Next.js"
            elif "express" in deps:
                framework = "Express"
            elif "react" in deps:
                framework = "React"
            elif "vue" in deps:
                framework = "Vue"
            return {
                "language": "Node.js",
                "framework": framework,
                "dependencies_summary": f"package.json ({len(deps)})",
            }

        return {"language": None, "framework": None, "dependencies_summary": None}

    finally:
        _safe_rmtree(path)