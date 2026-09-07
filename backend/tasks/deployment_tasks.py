from celery_app import celery_app
from database import SessionLocal
from repositories import project_repository, deployment_repository
from services import deployment_service


@celery_app.task(name="tasks.run_deployment")
def run_deployment_task(project_id: int, deployment_id: int):
    db = SessionLocal()
    try:
        project = project_repository.get_by_id(db, project_id)
        deployment = deployment_repository.get_by_id(db, deployment_id)
        if not project or not deployment:
            return {"error": "Projet ou déploiement introuvable"}
        deployment_service.deploy_project(db, project, deployment)
    finally:
        db.close()