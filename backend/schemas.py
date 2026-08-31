# Validation des données envoyées par les API

from pydantic import BaseModel
from datetime import datetime


# ==========================
# Schema utilisateur
# ==========================

class UserCreate(BaseModel):
    nom: str
    email: str
    mot_de_passe: str
    role: str


class UserResponse(BaseModel):
    id: int
    nom: str
    email: str
    role: str
    date_creation: datetime

    class Config:
        from_attributes = True


# ==========================
# Schema projet
# ==========================

class ProjectCreate(BaseModel):
    nom_projet: str
    langage: str
    framework: str
    description: str
    github_url: str
    version: str
    statut: str
    user_id: int


class ProjectResponse(ProjectCreate):
    id: int

    class Config:
        from_attributes = True


# ==========================
# Schema déploiement
# ==========================

class DeploymentCreate(BaseModel):
    project_id: int
    environnement: str
    statut: str


class DeploymentResponse(DeploymentCreate):
    id: int
    logs: str | None = None

    class Config:
        from_attributes = True
        # ==========================
# Schema diagnostic
# ==========================

class DiagnosticCreate(BaseModel):

    deployment_id: int
    type_erreur: str
    erreur: str
    solution: str
    gravite: str


class DiagnosticResponse(DiagnosticCreate):

    id: int
    date_analyse: datetime

    class Config:
        from_attributes = True