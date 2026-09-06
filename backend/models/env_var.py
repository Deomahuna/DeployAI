from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class EnvVar(Base):
    __tablename__ = "env_vars"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    key = Column(String, nullable=False)
    value_encrypted = Column(String, nullable=False)   # jamais en clair — chiffré avant stockage
    is_secret = Column(Boolean, default=True)            # contrôle l'affichage masqué/révélé côté front
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="env_vars")