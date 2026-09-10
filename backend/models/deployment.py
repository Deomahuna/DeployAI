from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.enums import DeploymentStatus


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    status = Column(
        Enum(DeploymentStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=DeploymentStatus.QUEUED,
        nullable=False
    )
    logs = Column(Text, nullable=True)
    commit_sha = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    # Liste de toutes les URLs exposées par ce déploiement :
    # [{"label": "web", "url": "http://host:32768"}, {"label": "api", "url": "http://host:32769"}, ...]
    # Remplace l'ancien champ preview_url (String unique) qui ne pouvait
    # retenir qu'un seul port, perdant silencieusement les autres.
    preview_urls = Column(JSON, nullable=True)

    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="deployments")
    diagnostic = relationship(
        "Diagnostic", back_populates="deployment",
        uselist=False, cascade="all, delete-orphan"
    )