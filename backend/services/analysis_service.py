import os
import shutil
import subprocess
from schemas.analysis import AnalysisResult
from core.exceptions import DeploymentError

CLONE_DIR = "workspace/analysis"


def _clone_for_analysis(repo_url: str) -> str:
    dest = os.path.join(CLONE_DIR, "tmp_analysis")
    if os.path.exists(dest):
        shutil.rmtree(dest)
    os.makedirs(CLONE_DIR, exist_ok=True)

    result = subprocess.run(
        ["git", "clone", "--depth", "1", repo_url, dest],
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


def analyze_repo(repo_url: str) -> AnalysisResult:
    path = _clone_for_analysis(repo_url)

    try:
        if os.path.exists(os.path.join(path, "requirements.txt")):
            count = _count_dependencies(path, "requirements.txt")
            framework = "FastAPI" if os.path.exists(os.path.join(path, "main.py")) else None
            return AnalysisResult(
                language="Python",
                framework=framework,
                dependencies_summary=f"requirements.txt ({count})",
            )

        if os.path.exists(os.path.join(path, "package.json")):
            import json
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
            return AnalysisResult(
                language="Node.js",
                framework=framework,
                dependencies_summary=f"package.json ({len(deps)})",
            )

        return AnalysisResult(language=None, framework=None, dependencies_summary=None)

    finally:
        shutil.rmtree(path, ignore_errors=True)