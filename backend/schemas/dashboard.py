from pydantic import BaseModel
from typing import List, Optional


class DashboardStats(BaseModel):
    active_projects: int
    deployments_this_month: int
    success_rate: str
    ai_resolved_errors: int


class ActivityItem(BaseModel):
    project_id: int
    project_name: str
    status: str
    time: str  # texte relatif, ex: "il y a 32s"


class DashboardSummary(BaseModel):
    stats: DashboardStats
    activity: List[ActivityItem]