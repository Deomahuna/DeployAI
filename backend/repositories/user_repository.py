from sqlalchemy.orm import Session
from models.user import User

def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def get_by_github_id(db: Session, github_id: str) -> User | None:
    return db.query(User).filter(User.github_id == github_id).first()

def get_by_gitlab_id(db: Session, gitlab_id: str) -> User | None:
    return db.query(User).filter(User.gitlab_id == gitlab_id).first()

def create(db: Session, user: User) -> User:
    db.add(user)
    return save(db, user)

def save(db: Session, user: User) -> User:
    db.commit()
    db.refresh(user)
    return user