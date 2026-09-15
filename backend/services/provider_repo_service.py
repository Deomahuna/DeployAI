import asyncio
import httpx
from sqlalchemy.orm import Session
from models.user import User
from repositories import project_repository
from core.security import decrypt_value
from core.exceptions import ExternalProviderError, NotFoundError

GITHUB_API_URL = "https://api.github.com/user/repos"
GITLAB_API_URL = "https://gitlab.com/api/v4/projects"

# Timeout explicite : connexion, lecture, écriture, pool
DEFAULT_TIMEOUT = httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0)


async def _get_with_retry(
    client: httpx.AsyncClient,
    url: str,
    retries: int = 3,
    backoff: float = 1.5,
    **kwargs,
) -> httpx.Response:
    """Effectue un GET avec retry en cas de timeout de connexion."""
    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            return await client.get(url, **kwargs)
        except (httpx.ConnectTimeout, httpx.ReadTimeout) as e:
            last_exc = e
            if attempt < retries - 1:
                await asyncio.sleep(backoff * (attempt + 1))
    raise last_exc


async def list_github_repos(db: Session, current_user: User) -> list[dict]:
    if not current_user.github_access_token:
        raise NotFoundError("Intégration GitHub", "non connectée")

    token = decrypt_value(current_user.github_access_token)

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await _get_with_retry(
                client,
                GITHUB_API_URL,
                headers={"Authorization": f"Bearer {token}"},
                params={"sort": "updated", "per_page": 50},
            )
    except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as e:
        raise ExternalProviderError(
            "GitHub", "Impossible de joindre GitHub (délai dépassé)."
        ) from e

    if response.status_code != 200:
        raise ExternalProviderError("GitHub", "Impossible de récupérer la liste des dépôts.")

    imported_ids = project_repository.get_imported_repo_ids(db, current_user.id)

    return [
        {
            "id": str(repo["id"]),
            "name": repo["name"],
            "full_name": repo["full_name"],
            "private": repo["private"],
            "updated_at": repo["updated_at"],
            "imported": str(repo["id"]) in imported_ids,
        }
        for repo in response.json()
    ]


async def list_gitlab_repos(db: Session, current_user: User) -> list[dict]:
    if not current_user.gitlab_access_token:
        raise NotFoundError("Intégration GitLab", "non connectée")

    token = decrypt_value(current_user.gitlab_access_token)

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await _get_with_retry(
                client,
                GITLAB_API_URL,
                headers={"Authorization": f"Bearer {token}"},
                params={"membership": "true", "order_by": "last_activity_at", "per_page": 50},
            )
    except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as e:
        raise ExternalProviderError(
            "GitLab", "Impossible de joindre GitLab (délai dépassé)."
        ) from e

    if response.status_code != 200:
        raise ExternalProviderError("GitLab", "Impossible de récupérer la liste des dépôts.")

    imported_ids = project_repository.get_imported_repo_ids(db, current_user.id)

    return [
        {
            "id": str(repo["id"]),
            "name": repo["name"],
            "full_name": repo["path_with_namespace"],
            "private": repo["visibility"] != "public",
            "updated_at": repo["last_activity_at"],
            "imported": str(repo["id"]) in imported_ids,
        }
        for repo in response.json()
    ]


async def list_github_branches(current_user: User, full_name: str) -> list[str]:
    if not current_user.github_access_token:
        raise NotFoundError("Intégration GitHub", "non connectée")
    token = decrypt_value(current_user.github_access_token)

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await _get_with_retry(
                client,
                f"https://api.github.com/repos/{full_name}/branches",
                headers={"Authorization": f"Bearer {token}"},
                params={"per_page": 100},
            )
    except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as e:
        raise ExternalProviderError(
            "GitHub", "Impossible de joindre GitHub (délai dépassé)."
        ) from e

    if response.status_code != 200:
        raise ExternalProviderError("GitHub", "Impossible de récupérer les branches.")
    return [b["name"] for b in response.json()]


async def list_gitlab_branches(current_user: User, full_name: str) -> list[str]:
    if not current_user.gitlab_access_token:
        raise NotFoundError("Intégration GitLab", "non connectée")
    token = decrypt_value(current_user.gitlab_access_token)
    project_id_encoded = full_name.replace("/", "%2F")

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await _get_with_retry(
                client,
                f"https://gitlab.com/api/v4/projects/{project_id_encoded}/repository/branches",
                headers={"Authorization": f"Bearer {token}"},
            )
    except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as e:
        raise ExternalProviderError(
            "GitLab", "Impossible de joindre GitLab (délai dépassé)."
        ) from e

    if response.status_code != 200:
        raise ExternalProviderError("GitLab", "Impossible de récupérer les branches.")
    return [b["name"] for b in response.json()]