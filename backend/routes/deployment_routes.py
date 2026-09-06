from fastapi import APIRouter
from schemas.deployment import DeploymentOut, DiagnosticOut
from controllers import deployment_controller

router = APIRouter(tags=["deployments"])

router.add_api_route("/deployments", deployment_controller.list_deployments, methods=["GET"], response_model=list[DeploymentOut])
router.add_api_route("/deployments/{deployment_id}/diagnosis", deployment_controller.get_diagnosis, methods=["GET"], response_model=DiagnosticOut)
router.add_api_route("/diagnostics/{deployment_id}/resolve", deployment_controller.resolve_diagnostic, methods=["POST"])