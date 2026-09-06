from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.provider_repo import RepoOut
from core.security import get_current_user
from core.exceptions import NotFoundError
from services import provider_repo_service


async def list_repos(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RepoOut]:
    if provider == "github":
        return await provider_repo_service.list_github_repos(db, current_user)
    if provider == "gitlab":
        return await provider_repo_service.list_gitlab_repos(db, current_user)
    raise NotFoundError("Provider", provider)