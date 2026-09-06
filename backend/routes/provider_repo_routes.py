from fastapi import APIRouter
from schemas.provider_repo import RepoOut
from controllers import provider_repo_controller

router = APIRouter(prefix="/import", tags=["import"])

router.add_api_route("/repos", provider_repo_controller.list_repos, methods=["GET"], response_model=list[RepoOut])