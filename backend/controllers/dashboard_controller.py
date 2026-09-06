from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.dashboard import DashboardSummary
from core.security import get_current_user
from services import dashboard_service


def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    return dashboard_service.get_summary(db, current_user)