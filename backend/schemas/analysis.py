from pydantic import BaseModel
from typing import Optional

class AnalyzeRequest(BaseModel):
    repo_url: str
    branch: str = "main"
    subdirectory: Optional[str] = None

class AnalysisResult(BaseModel):
    language: Optional[str] = None
    framework: Optional[str] = None
    dependencies_summary: Optional[str] = None

