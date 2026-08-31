# =====================================================
# Authentification des utilisateurs
# =====================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentification"]
)


# Connexion utilisateur
@router.post("/login")
def login(email: str, mot_de_passe: str, db: Session = Depends(get_db)):

    # Recherche de l'utilisateur
    utilisateur = db.query(User).filter(User.email == email).first()

    # Vérification de l'utilisateur
    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable"
        )

    # Vérification du mot de passe
    if utilisateur.mot_de_passe != mot_de_passe:
        raise HTTPException(
            status_code=401,
            detail="Mot de passe incorrect"
        )

    # Connexion réussie
    return {
        "message": "Connexion réussie",
        "utilisateur": utilisateur.nom,
        "role": utilisateur.role
    }