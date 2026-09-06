import os
from fastapi import Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from repositories import user_repository
from core.security import create_access_token, decode_token
from core.exceptions import InvalidTokenError
from services import oauth_service

FRONTEND_URL = os.getenv("FRONTEND_URL")


def _get_user_from_token(token: str, db: Session):
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenError()
    current_user = user_repository.get_by_id(db, int(user_id))
    if not current_user:
        raise InvalidTokenError("Utilisateur introuvable.")
    return current_user


# --- Lier une intégration à un compte déjà connecté (Settings) ---

def github_connect(token: str, db: Session = Depends(get_db)):
    current_user = _get_user_from_token(token, db)
    state = create_access_token({"sub": str(current_user.id), "intent": "link"})
    return RedirectResponse(oauth_service.get_github_authorize_url(state))


def gitlab_connect(token: str, db: Session = Depends(get_db)):
    current_user = _get_user_from_token(token, db)
    state = create_access_token({"sub": str(current_user.id), "intent": "link"})
    return RedirectResponse(oauth_service.get_gitlab_authorize_url(state))


# --- Connexion/inscription directe (Login, Register) ---

def github_login():
    state = create_access_token({"intent": "auth"})
    return RedirectResponse(oauth_service.get_github_authorize_url(state))


def gitlab_login():
    state = create_access_token({"intent": "auth"})
    return RedirectResponse(oauth_service.get_gitlab_authorize_url(state))


# --- Callback unique, branché selon l'intention encodée dans "state" ---

async def github_callback(code: str, state: str, db: Session = Depends(get_db)):
    payload = decode_token(state)

    if payload.get("intent") == "link":
        current_user = user_repository.get_by_id(db, int(payload["sub"]))
        await oauth_service.link_github_account(db, current_user, code)
        return RedirectResponse(f"{FRONTEND_URL}/settings?integration=github&status=linked")

    user, created = await oauth_service.login_or_register_with_github(db, code)
    token = create_access_token({"sub": str(user.id)})
    status_flag = "created" if created else "logged_in"
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={token}&provider=github&status={status_flag}")


async def gitlab_callback(code: str, state: str, db: Session = Depends(get_db)):
    payload = decode_token(state)

    if payload.get("intent") == "link":
        current_user = user_repository.get_by_id(db, int(payload["sub"]))
        await oauth_service.link_gitlab_account(db, current_user, code)
        return RedirectResponse(f"{FRONTEND_URL}/settings?integration=gitlab&status=linked")

    user, created = await oauth_service.login_or_register_with_gitlab(db, code)
    token = create_access_token({"sub": str(user.id)})
    status_flag = "created" if created else "logged_in"
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={token}&provider=gitlab&status={status_flag}")