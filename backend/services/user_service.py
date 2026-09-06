from sqlalchemy.orm import Session
from fastapi import UploadFile
from models.user import User
from schemas.user import UserUpdate, PasswordUpdate
from repositories import user_repository
from core.security import hash_password
from core.exceptions import AlreadyExistsError, NotFoundError
from storage import get_storage


def update_profile(db: Session, current_user: User, payload: UserUpdate) -> User:
    if payload.email and payload.email != current_user.email:
        if user_repository.get_by_email(db, payload.email):
            raise AlreadyExistsError("Cet email est déjà utilisé.")
        current_user.email = payload.email

    if payload.full_name:
        current_user.full_name = payload.full_name

    return user_repository.save(db, current_user)


def update_password(db: Session, current_user: User, payload: PasswordUpdate) -> None:
    current_user.hashed_password = hash_password(payload.new_password)
    user_repository.save(db, current_user)


def update_avatar(db: Session, current_user: User, file: UploadFile) -> User:
    storage = get_storage()
    if current_user.avatar_url:
        storage.delete(current_user.avatar_url)
    current_user.avatar_url = storage.save(file, folder="avatars")
    return user_repository.save(db, current_user)


def get_integrations(current_user: User) -> dict:
    return {
        "github": {"connected": bool(current_user.github_username), "account": current_user.github_username},
        "gitlab": {"connected": bool(current_user.gitlab_username), "account": current_user.gitlab_username},
    }


def disconnect_integration(db: Session, current_user: User, provider: str) -> None:
    if provider == "github":
        current_user.github_username = None
        current_user.github_access_token = None
    elif provider == "gitlab":
        current_user.gitlab_username = None
        current_user.gitlab_access_token = None
    else:
        raise NotFoundError("Provider", provider)
    user_repository.save(db, current_user)