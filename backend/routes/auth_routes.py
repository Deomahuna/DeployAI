from fastapi import APIRouter, status
from schemas.user import UserOut, Token
from controllers import auth_controller

router = APIRouter(prefix="/auth", tags=["auth"])

router.add_api_route(
    "/register", auth_controller.register,
    methods=["POST"], response_model=UserOut, status_code=status.HTTP_201_CREATED,
)
router.add_api_route("/login", auth_controller.login, methods=["POST"], response_model=Token)
router.add_api_route("/verify-otp", auth_controller.verify_otp, methods=["POST"], response_model=Token)
router.add_api_route("/resend-otp", auth_controller.resend_otp, methods=["POST"])
router.add_api_route("/forgot-password", auth_controller.forgot_password, methods=["POST"])
router.add_api_route("/reset-password", auth_controller.reset_password, methods=["POST"])