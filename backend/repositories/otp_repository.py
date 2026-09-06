from sqlalchemy.orm import Session
from models.otp import OtpCode

def create(db: Session, otp: OtpCode) -> OtpCode:
    db.add(otp)
    db.commit()
    db.refresh(otp)
    return otp

def get_latest_for_user(db: Session, user_id: int) -> OtpCode | None:
    return (
        db.query(OtpCode)
        .filter(OtpCode.user_id == user_id)
        .order_by(OtpCode.created_at.desc())
        .first()
    )

def delete_all_for_user(db: Session, user_id: int) -> None:
    db.query(OtpCode).filter(OtpCode.user_id == user_id).delete()
    db.commit()