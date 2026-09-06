from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.enums import ProjectStatus

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    repo_url = Column(String, nullable=False)
    provider = Column(String, nullable=False)              # "github" | "gitlab"
    repo_id = Column(String, nullable=True)                 # id externe du dépôt (évite les doublons)
    language = Column(String, nullable=True)                # détecté par l'analyse auto
    framework = Column(String, nullable=True)
    dependencies_summary = Column(String, nullable=True)    # ex: "requirements.txt (23)"
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PENDING, nullable=False)
    url = Column(String, nullable=True)                     # URL de l'app déployée (bouton "Ouvrir l'app")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=True)

    owner = relationship("User", back_populates="projects")
    server = relationship("Server", back_populates="projects")
    deployments = relationship("Deployment", back_populates="project", cascade="all, delete-orphan")
    env_vars = relationship("EnvVar", back_populates="project", cascade="all, delete-orphan")