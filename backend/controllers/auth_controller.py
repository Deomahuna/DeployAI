from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import (
    UserCreate, UserLogin,  UserOut, Token,
    OtpVerify, OtpResend, ForgotPasswordRequest, ResetPasswordRequest,
)
from services import auth_service


async def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    return await auth_service.register(db, payload)


def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    token = auth_service.login(db, payload)
    return Token(access_token=token)


def verify_otp(payload: OtpVerify, db: Session = Depends(get_db)) -> Token:
    token = auth_service.verify_otp(db, payload.email, payload.code)
    return Token(access_token=token)


async def resend_otp(payload: OtpResend, db: Session = Depends(get_db)):
    await auth_service.resend_otp(db, payload.email)
    return {"message": "Code renvoyé."}


async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    await auth_service.forgot_password(db, payload.email)
    return {"message": "Si un compte existe, un code a été envoyé."}


def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_password(db, payload.email, payload.code, payload.new_password)
    return {"message": "Mot de passe réinitialisé."}