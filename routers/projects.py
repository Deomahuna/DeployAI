# Router de gestion des projets

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.project import Project
from schemas import ProjectCreate


router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


# =====================================================
# Lire tous les projets
# =====================================================

@router.get("/")
def get_projects(db: Session = Depends(get_db)):

    projets = db.query(Project).all()

    return projets


# =====================================================
# Lire un projet
# =====================================================

@router.get("/{project_id}")
def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):

    projet = db.query(Project).filter(
        Project.id == project_id
    ).first()

    return projet


# =====================================================
# Créer un projet
# =====================================================

@router.post("/")
def create_project(
    projet: ProjectCreate,
    db: Session = Depends(get_db)
):

    nouveau_projet = Project(
        nom_projet=projet.nom_projet,
        langage=projet.langage,
        framework=projet.framework,
        description=projet.description,
        github_url=projet.github_url,
        version=projet.version,
        statut=projet.statut,
        user_id=projet.user_id
    )

    db.add(nouveau_projet)
    db.commit()
    db.refresh(nouveau_projet)

    return nouveau_projet


# =====================================================
# Modifier un projet
# =====================================================

@router.put("/{project_id}")
def update_project(
    project_id: int,
    projet: ProjectCreate,
    db: Session = Depends(get_db)
):

    projet_existant = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if projet_existant is None:
        return {
            "message": "Projet introuvable"
        }

    projet_existant.nom_projet = projet.nom_projet
    projet_existant.langage = projet.langage
    projet_existant.framework = projet.framework
    projet_existant.description = projet.description
    projet_existant.github_url = projet.github_url
    projet_existant.version = projet.version
    projet_existant.statut = projet.statut
    projet_existant.user_id = projet.user_id

    db.commit()
    db.refresh(projet_existant)

    return projet_existant


# =====================================================
# Supprimer un projet
# =====================================================

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):

    projet = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if projet is None:
        return {
            "message": "Projet introuvable"
        }

    db.delete(projet)
    db.commit()

    return {
        "message": f"Projet {project_id} supprimé avec succès"
    }