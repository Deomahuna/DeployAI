from fastapi import APIRouter
from schemas.analysis import AnalysisResult
from controllers import analysis_controller

router = APIRouter(prefix="/projects", tags=["projects"])

router.add_api_route("/analyze", analysis_controller.analyze_project, methods=["POST"], response_model=AnalysisResult)