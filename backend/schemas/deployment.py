from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class DeploymentOut(BaseModel):
    id: int
    project_id: int
    status: str
    logs: Optional[str] = None
    duration_seconds: Optional[int] = None
    started_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SolutionItem(BaseModel):
    title: str
    command: Optional[str] = None
    note: Optional[str] = None


class DiagnosticOut(BaseModel):
    id: int
    deployment_id: int
    cause: str
    severity: str
    confidence: float
    solutions: List[SolutionItem]
    resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True