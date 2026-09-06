from fastapi import Depends, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserOut, UserUpdate, PasswordUpdate, IntegrationsOut
from core.security import get_current_user
from services import user_service


def get_profile(current_user: User = Depends(get_current_user)) -> UserOut:
    return current_user


def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    return user_service.update_profile(db, current_user, payload)


def update_password(
    payload: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_service.update_password(db, current_user, payload)
    return {"message": "Mot de passe mis à jour."}


def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    return user_service.update_avatar(db, current_user, file)


def get_integrations(current_user: User = Depends(get_current_user)) -> IntegrationsOut:
    return user_service.get_integrations(current_user)


def disconnect_integration(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_service.disconnect_integration(db, current_user, provider)
    return {"message": f"{provider} déconnecté."}