import os
import httpx
from sqlalchemy.orm import Session
from models.user import User
from repositories import user_repository
from core.security import encrypt_value
from core.exceptions import ExternalProviderError

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

GITLAB_CLIENT_ID = os.getenv("GITLAB_CLIENT_ID")
GITLAB_CLIENT_SECRET = os.getenv("GITLAB_CLIENT_SECRET")
GITLAB_REDIRECT_URI = "http://localhost:8000/auth/gitlab/callback"


# --- GitHub ---

def get_github_authorize_url(state: str) -> str:
    return (
        "https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}&scope=repo,user:email&state={state}"
    )


async def _exchange_github_code(code: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={"client_id": GITHUB_CLIENT_ID, "client_secret": GITHUB_CLIENT_SECRET, "code": code},
        )
    access_token = response.json().get("access_token")
    if not access_token:
        raise ExternalProviderError("GitHub", "Échange du code d'autorisation échoué.")
    return access_token


async def _fetch_github_profile(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_response.status_code != 200:
            raise ExternalProviderError("GitHub", "Impossible de récupérer le profil utilisateur.")
        profile = user_response.json()

        email = profile.get("email")
        if not email:
            emails_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if emails_response.status_code == 200:
                for entry in emails_response.json():
                    if entry.get("primary") and entry.get("verified"):
                        email = entry.get("email")
                        break

    return {
        "id": str(profile["id"]),
        "username": profile["login"],
        "email": email,
        "full_name": profile.get("name") or profile["login"],
    }


async def link_github_account(db: Session, current_user: User, code: str) -> User:
    access_token = await _exchange_github_code(code)
    profile = await _fetch_github_profile(access_token)

    current_user.github_id = profile["id"]
    current_user.github_username = profile["username"]
    current_user.github_access_token = encrypt_value(access_token)
    return user_repository.save(db, current_user)


async def login_or_register_with_github(db: Session, code: str) -> tuple[User, bool]:
    access_token = await _exchange_github_code(code)
    profile = await _fetch_github_profile(access_token)

    user = user_repository.get_by_github_id(db, profile["id"])
    created = False

    if not user and profile["email"]:
        user = user_repository.get_by_email(db, profile["email"])

    if not user:
        user = User(
            full_name=profile["full_name"],
            email=profile["email"] or f"github-{profile['id']}@users.deployai.local",
            hashed_password=None,
            email_verified=True,
            github_id=profile["id"],
            github_username=profile["username"],
            github_access_token=encrypt_value(access_token),
        )
        user = user_repository.create(db, user)
        created = True
    else:
        user.github_id = profile["id"]
        user.github_username = profile["username"]
        user.github_access_token = encrypt_value(access_token)
        user = user_repository.save(db, user)

    return user, created


# --- GitLab (même principe) ---

def get_gitlab_authorize_url(state: str) -> str:
    return (
        "https://gitlab.com/oauth/authorize"
        f"?client_id={GITLAB_CLIENT_ID}&redirect_uri={GITLAB_REDIRECT_URI}"
        f"&response_type=code&scope=read_api+read_repository&state={state}"
    )


async def _exchange_gitlab_code(code: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://gitlab.com/oauth/token",
            data={
                "client_id": GITLAB_CLIENT_ID,
                "client_secret": GITLAB_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GITLAB_REDIRECT_URI,
            },
        )
    access_token = response.json().get("access_token")
    if not access_token:
        raise ExternalProviderError("GitLab", "Échange du code d'autorisation échoué.")
    return access_token


async def _fetch_gitlab_profile(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://gitlab.com/api/v4/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if response.status_code != 200:
        raise ExternalProviderError("GitLab", "Impossible de récupérer le profil utilisateur.")
    profile = response.json()
    return {
        "id": str(profile["id"]),
        "username": profile["username"],
        "email": profile.get("email"),
        "full_name": profile.get("name") or profile["username"],
    }


async def link_gitlab_account(db: Session, current_user: User, code: str) -> User:
    access_token = await _exchange_gitlab_code(code)
    profile = await _fetch_gitlab_profile(access_token)

    current_user.gitlab_id = profile["id"]
    current_user.gitlab_username = profile["username"]
    current_user.gitlab_access_token = encrypt_value(access_token)
    return user_repository.save(db, current_user)


async def login_or_register_with_gitlab(db: Session, code: str) -> tuple[User, bool]:
    access_token = await _exchange_gitlab_code(code)
    profile = await _fetch_gitlab_profile(access_token)

    user = user_repository.get_by_gitlab_id(db, profile["id"])
    created = False

    if not user and profile["email"]:
        user = user_repository.get_by_email(db, profile["email"])

    if not user:
        user = User(
            full_name=profile["full_name"],
            email=profile["email"] or f"gitlab-{profile['id']}@users.deployai.local",
            hashed_password=None,
            email_verified=True,
            gitlab_id=profile["id"],
            gitlab_username=profile["username"],
            gitlab_access_token=encrypt_value(access_token),
        )
        user = user_repository.create(db, user)
        created = True
    else:
        user.gitlab_id = profile["id"]
        user.gitlab_username = profile["username"]
        user.gitlab_access_token = encrypt_value(access_token)
        user = user_repository.save(db, user)

    return user, created