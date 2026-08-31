from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas import UserCreate


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# Voir tous les utilisateurs
@router.get("/")
def get_users(db: Session = Depends(get_db)):

    utilisateurs = db.query(User).all()

    return utilisateurs



# Créer un utilisateur
@router.post("/")
def create_user(
    utilisateur: UserCreate,
    db: Session = Depends(get_db)
):

    nouvel_utilisateur = User(
        nom=utilisateur.nom,
        email=utilisateur.email,
        mot_de_passe=utilisateur.mot_de_passe,
        role=utilisateur.role
    )

    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)

    return nouvel_utilisateur