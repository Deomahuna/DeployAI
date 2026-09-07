from fastapi import Depends
from models.user import User
from core.security import get_current_user
from schemas.analysis import AnalyzeRequest, AnalysisResult
from services import analysis_service


def analyze_project(
    payload: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
) -> AnalysisResult:
    return analysis_service.analyze_repo(payload.repo_url, payload.branch, payload.subdirectory)