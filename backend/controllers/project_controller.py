from fastapi import Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.project import (
    ProjectOut, ProjectDetailOut, ProjectCreate, EnvVarCreate,
    ImportUrlRequest, BuildConfigOut, BuildConfigUpdate,
)
from schemas.deployment import DeploymentOut
from core.security import get_current_user
from services import project_service


def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProjectOut]:
    return project_service.list_projects(db, current_user)


def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectDetailOut:
    project = project_service.get_project(db, project_id, current_user)
    return {
        **ProjectOut.model_validate(project).model_dump(),
        "stats": project_service.compute_stats(project),
        "env_vars": project_service.get_decrypted_env_vars(project),
        "deployments": project.deployments,
    }


def import_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectOut:
    return project_service.import_project(db, current_user, payload)


def import_from_url(
    payload: ImportUrlRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectOut:
    return project_service.import_from_url(db, current_user, payload.name, payload.repo_url)


def import_from_archive(
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectOut:
    return project_service.import_from_archive(db, current_user, name, file)


def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project_service.delete_project(db, project_id, current_user)
    return {"message": "Projet supprimé."}


def add_env_var(
    project_id: int,
    payload: EnvVarCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project_service.add_env_var(db, project_id, current_user, payload)
    return {"message": "Variable ajoutée."}


def remove_env_var(
    project_id: int,
    key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project_service.remove_env_var(db, project_id, current_user, key)
    return {"message": "Variable supprimée."}


def deploy_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DeploymentOut:
    return project_service.deploy(db, project_id, current_user)


def get_build_config(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BuildConfigOut:
    return project_service.get_build_config(db, project_id, current_user)


def update_build_config(
    project_id: int,
    payload: BuildConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BuildConfigOut:
    return project_service.update_build_config(db, project_id, current_user, payload)