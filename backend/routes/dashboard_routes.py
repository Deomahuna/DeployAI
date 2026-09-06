from fastapi import APIRouter
from schemas.dashboard import DashboardSummary
from controllers import dashboard_controller

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

router.add_api_route("/summary", dashboard_controller.get_summary, methods=["GET"], response_model=DashboardSummary)