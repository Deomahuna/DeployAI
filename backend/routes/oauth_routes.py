from fastapi import APIRouter
from controllers import oauth_controller

router = APIRouter(prefix="/auth", tags=["oauth"])

router.add_api_route("/github/connect", oauth_controller.github_connect, methods=["GET"])
router.add_api_route("/github/login", oauth_controller.github_login, methods=["GET"])
router.add_api_route("/github/callback", oauth_controller.github_callback, methods=["GET"])

router.add_api_route("/gitlab/connect", oauth_controller.gitlab_connect, methods=["GET"])
router.add_api_route("/gitlab/login", oauth_controller.gitlab_login, methods=["GET"])
router.add_api_route("/gitlab/callback", oauth_controller.gitlab_callback, methods=["GET"])