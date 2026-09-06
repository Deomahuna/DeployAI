from sqlalchemy.orm import Session
from models.project import Project
from models.env_var import EnvVar

def get_all_by_owner(db: Session, owner_id: int) -> list[Project]:
    return db.query(Project).filter(Project.owner_id == owner_id).all()

def get_by_id(db: Session, project_id: int) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()

def create(db: Session, project: Project) -> Project:
    db.add(project)
    return save(db, project)

def save(db: Session, project: Project) -> Project:
    db.commit()
    db.refresh(project)
    return project

def delete(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()

def add_env_var(db: Session, env_var: EnvVar) -> EnvVar:
    db.add(env_var)
    db.commit()
    db.refresh(env_var)
    return env_var

def get_env_var(db: Session, project_id: int, key: str) -> EnvVar | None:
    return db.query(EnvVar).filter(EnvVar.project_id == project_id, EnvVar.key == key).first()

def delete_env_var(db: Session, env_var: EnvVar) -> None:
    db.delete(env_var)
    db.commit()

def get_imported_repo_ids(db: Session, owner_id: int) -> set[str]:
    rows = db.query(Project.repo_id).filter(Project.owner_id == owner_id).all()
    return {r[0] for r in rows if r[0]}