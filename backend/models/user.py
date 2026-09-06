from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False)

    avatar_url = Column(String, nullable=True)

    github_id = Column(String, unique=True, nullable=True)
    github_username = Column(String, nullable=True)
    github_access_token = Column(String, nullable=True)
    gitlab_id = Column(String, unique=True, nullable=True)
    gitlab_username = Column(String, nullable=True)
    gitlab_access_token = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")