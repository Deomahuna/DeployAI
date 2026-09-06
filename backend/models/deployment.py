from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.enums import DeploymentStatus

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    status = Column(Enum(DeploymentStatus), default=DeploymentStatus.QUEUED, nullable=False)
    logs = Column(Text, nullable=True)                # sortie brute (build + run)
    commit_sha = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="deployments")
    diagnostic = relationship(
        "Diagnostic", back_populates="deployment",
        uselist=False, cascade="all, delete-orphan"
    )