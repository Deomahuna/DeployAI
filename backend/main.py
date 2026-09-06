from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from core.error_handlers import register_exception_handlers
from routes import (
    auth_routes, user_routes, project_routes,
    deployment_routes, dashboard_routes, oauth_routes,
    provider_repo_routes, analysis_routes, websocket_routes,
)

app = FastAPI(title="DeployAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(project_routes.router)
app.include_router(deployment_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(oauth_routes.router)
app.include_router(provider_repo_routes.router)
app.include_router(analysis_routes.router)
app.include_router(websocket_routes.router)