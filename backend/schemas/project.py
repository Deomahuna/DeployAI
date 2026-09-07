from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProjectOut(BaseModel):
    id: int
    name: str
    repo_url: Optional[str] = None
    provider: str
    language: Optional[str] = None
    framework: Optional[str] = None
    status: str
    url: Optional[str] = None
    branch: Optional[str] = None
    subdirectory: Optional[str] = None
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
    branch: Optional[str] = "main"
    subdirectory: Optional[str] = None

class EnvVarCreate(BaseModel):
    key: str
    value: str
    is_secret: bool = True

class ImportUrlRequest(BaseModel):
    name: str
    repo_url: str

class BuildConfigOut(BaseModel):
    strategy: str
    language: Optional[str] = None
    version: Optional[str] = None
    install_cmd: Optional[str] = None
    start_cmd: Optional[str] = None
    port: Optional[int] = None
    dockerfile_path: Optional[str] = None

class BuildConfigUpdate(BaseModel):
    language: Optional[str] = None
    version: Optional[str] = None
    install_cmd: Optional[str] = None
    start_cmd: Optional[str] = None
    port: Optional[int] = None