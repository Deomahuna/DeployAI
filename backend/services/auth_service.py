import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from models.user import User
from models.otp import OtpCode
from schemas.user import UserCreate, UserLogin
from repositories import user_repository, otp_repository
from core.security import hash_password, verify_password, create_access_token
from core.exceptions import AlreadyExistsError, InvalidCredentialsError, AppException
from services.email_service import send_otp_email, send_reset_password_email

OTP_EXPIRE_MINUTES = 10


def _generate_otp_code() -> str:
    return f"{random.randint(0, 999999):06d}"


async def register(db: Session, payload: UserCreate) -> User:
    if user_repository.get_by_email(db, payload.email):
        raise AlreadyExistsError("Cet email est déjà utilisé.")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        email_verified=False,
    )
    user = user_repository.create(db, user)

    await _send_new_otp(db, user, send_otp_email)
    return user


async def _send_new_otp(db: Session, user: User, email_sender) -> None:
    otp_repository.delete_all_for_user(db, user.id)
    code = _generate_otp_code()
    otp = OtpCode(
        user_id=user.id,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    otp_repository.create(db, otp)
    print(f"[DEBUG OTP] Envoi du code {code} à {user.email}")
    await email_sender(user.email, code)
    print(f"[DEBUG OTP] Email envoyé avec succès à {user.email}")


async def resend_otp(db: Session, email: str) -> None:
    user = user_repository.get_by_email(db, email)
    if not user:
        raise AppException("Aucun compte associé à cet email.", status_code=404)
    if user.email_verified:
        raise AppException("Cet email est déjà vérifié.", status_code=400)
    await _send_new_otp(db, user, send_otp_email)


def verify_otp(db: Session, email: str, code: str) -> str:
    user = user_repository.get_by_email(db, email)
    if not user:
        raise AppException("Aucun compte associé à cet email.", status_code=404)

    otp = otp_repository.get_latest_for_user(db, user.id)
    if not otp or otp.code != code:
        raise AppException("Code de vérification invalide.", status_code=400)

    expires_at = otp.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise AppException("Ce code a expiré. Demande-en un nouveau.", status_code=400)

    user.email_verified = True
    user_repository.save(db, user)
    otp_repository.delete_all_for_user(db, user.id)

    return create_access_token({"sub": str(user.id)})


def login(db: Session, payload: UserLogin) -> str:
    user = user_repository.get_by_email(db, payload.email)
    if not user or not user.hashed_password:
        raise InvalidCredentialsError()
    if not verify_password(payload.password, user.hashed_password):
        raise InvalidCredentialsError()
    if not user.email_verified:
        raise AppException("Email non vérifié. Vérifie ta boîte mail.", status_code=403)

    return create_access_token({"sub": str(user.id)})


async def forgot_password(db: Session, email: str) -> None:
    user = user_repository.get_by_email(db, email)
    if not user:
        return
    if not user.hashed_password:
        return
    await _send_new_otp(db, user, send_reset_password_email)


def reset_password(db: Session, email: str, code: str, new_password: str) -> None:
    user = user_repository.get_by_email(db, email)
    if not user:
        raise AppException("Code invalide ou expiré.", status_code=400)

    otp = otp_repository.get_latest_for_user(db, user.id)
    if not otp or otp.code != code:
        raise AppException("Code invalide ou expiré.", status_code=400)

    expires_at = otp.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise AppException("Ce code a expiré. Redemande un lien.", status_code=400)

    user.hashed_password = hash_password(new_password)
    user_repository.save(db, user)
    otp_repository.delete_all_for_user(db, user.id)