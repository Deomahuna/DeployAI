from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.enums import ProjectStatus

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    repo_url = Column(String, nullable=True)
    local_archive_path = Column(String, nullable=True)
    provider = Column(String, nullable=False)
    repo_id = Column(String, nullable=True)
    language = Column(String, nullable=True)
    framework = Column(String, nullable=True)
    dependencies_summary = Column(String, nullable=True)
    status = Column(
        Enum(ProjectStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=ProjectStatus.PENDING,
        nullable=False
    )
    url = Column(String, nullable=True)
    build_config = Column(JSON, nullable=True)
    branch = Column(String, nullable=True, default="main")
    subdirectory = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=True)

    owner = relationship("User", back_populates="projects")
    server = relationship("Server", back_populates="projects")
    deployments = relationship("Deployment", back_populates="project", cascade="all, delete-orphan")
    env_vars = relationship("EnvVar", back_populates="project", cascade="all, delete-orphan")