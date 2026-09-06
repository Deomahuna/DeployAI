from fastapi import APIRouter, status
from schemas.project import ProjectOut, ProjectDetailOut
from controllers import project_controller
from schemas.deployment import DeploymentOut

router = APIRouter(prefix="/projects", tags=["projects"])

router.add_api_route("", project_controller.list_projects, methods=["GET"], response_model=list[ProjectOut])
router.add_api_route("/import", project_controller.import_project, methods=["POST"], response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
router.add_api_route("/{project_id}", project_controller.get_project, methods=["GET"], response_model=ProjectDetailOut)
router.add_api_route("/{project_id}", project_controller.delete_project, methods=["DELETE"])
router.add_api_route("/{project_id}/env", project_controller.add_env_var, methods=["POST"], status_code=status.HTTP_201_CREATED)
router.add_api_route("/{project_id}/env/{key}", project_controller.remove_env_var, methods=["DELETE"])
router.add_api_route("/{project_id}/deploy", project_controller.deploy_project, methods=["POST"], response_model=DeploymentOut, status_code=status.HTTP_201_CREATED)