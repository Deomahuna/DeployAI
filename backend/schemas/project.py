from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProjectOut(BaseModel):
    id: int
    name: str
    repo_url: str
    provider: str
    language: Optional[str] = None
    framework: Optional[str] = None
    status: str
    url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectStats(BaseModel):
    total: int
    success_rate: str
    avg_build_seconds: Optional[float] = None

class EnvVarOut(BaseModel):
    key: str
    value: str
    is_secret: bool

class DeploymentSummary(BaseModel):
    id: int
    status: str
    duration_seconds: Optional[int] = None
    started_at: datetime

    class Config:
        from_attributes = True

class ProjectDetailOut(ProjectOut):
    stats: ProjectStats
    env_vars: List[EnvVarOut]
    deployments: List[DeploymentSummary]

class ProjectCreate(BaseModel):
    name: str
    repo_url: str
    provider: str
    repo_id: Optional[str] = None
    language: Optional[str] = None
    framework: Optional[str] = None
    dependencies_summary: Optional[str] = None

class EnvVarCreate(BaseModel):
    key: str
    value: str
    is_secret: bool = True