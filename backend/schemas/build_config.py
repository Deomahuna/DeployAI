from pydantic import BaseModel
from typing import Optional

class BuildConfig(BaseModel):
    strategy: str
    language: Optional[str] = None
    version: Optional[str] = None
    install_cmd: Optional[str] = None
    start_cmd: Optional[str] = None
    port: Optional[int] = None
    dockerfile_path: Optional[str] = None  # chemin custom si Dockerfile déjà présent ailleurs