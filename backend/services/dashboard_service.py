from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models.user import User
from schemas.dashboard import DashboardSummary, DashboardStats, ActivityItem
from repositories import dashboard_repository


def _relative_time(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    delta = now - dt.replace(tzinfo=timezone.utc)
    seconds = int(delta.total_seconds())

    if seconds < 60:
        return f"il y a {seconds}s"
    if seconds < 3600:
        return f"il y a {seconds // 60} min"
    if seconds < 86400:
        return f"il y a {seconds // 3600}h"
    if seconds < 172800:
        return "hier"
    return f"il y a {seconds // 86400} jours"


def get_summary(db: Session, current_user: User) -> DashboardSummary:
    owner_id = current_user.id

    stats = DashboardStats(
        active_projects=dashboard_repository.count_active_projects(db, owner_id),
        deployments_this_month=dashboard_repository.count_deployments_this_month(db, owner_id),
        success_rate=dashboard_repository.compute_success_rate(db, owner_id),
        ai_resolved_errors=dashboard_repository.count_ai_resolved_errors(db, owner_id),
    )

    recent = dashboard_repository.get_recent_deployments(db, owner_id)
    activity = [
        ActivityItem(
            project_id=d.project.id,
            project_name=d.project.name,
            status=d.status.value,
            time=_relative_time(d.started_at),
        )
        for d in recent
    ]

    return DashboardSummary(stats=stats, activity=activity)