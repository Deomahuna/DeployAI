from fastapi import APIRouter
from schemas.user import UserOut, IntegrationsOut
from controllers import user_controller

router = APIRouter(prefix="/me", tags=["me"])

router.add_api_route("", user_controller.get_profile, methods=["GET"], response_model=UserOut)
router.add_api_route("", user_controller.update_profile, methods=["PATCH"], response_model=UserOut)
router.add_api_route("/password", user_controller.update_password, methods=["POST"])
router.add_api_route("/avatar", user_controller.upload_avatar, methods=["POST"], response_model=UserOut)
router.add_api_route("/integrations", user_controller.get_integrations, methods=["GET"], response_model=IntegrationsOut)
router.add_api_route("/integrations/{provider}", user_controller.disconnect_integration, methods=["DELETE"])