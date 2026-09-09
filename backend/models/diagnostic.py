from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.enums import DiagnosticSeverity

class Diagnostic(Base):
    __tablename__ = "diagnostics"

    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("deployments.id"), unique=True, nullable=False)

    cause = Column(Text, nullable=False)
    severity = Column(
        Enum(DiagnosticSeverity, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False
    )
    confidence = Column(Float, nullable=False)         # 0.0 à 1.0
    solutions = Column(JSON, nullable=False)            # liste de {label, command}

    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    deployment = relationship("Deployment", back_populates="diagnostic")