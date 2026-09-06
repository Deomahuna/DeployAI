import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from core.exceptions import AppException

logger = logging.getLogger("deployai")

def register_exception_handlers(app: FastAPI):

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.warning(f"[{exc.status_code}] {exc.message} — {request.method} {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Erreurs de schéma Pydantic (champ manquant, mauvais type, etc.)
        errors = [{"field": ".".join(str(x) for x in e["loc"]), "message": e["msg"]} for e in exc.errors()]
        return JSONResponse(
            status_code=422,
            content={"error": "Données invalides.", "details": errors},
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        # Ex: email déjà utilisé (contrainte unique) non attrapé en amont
        logger.error(f"IntegrityError: {exc}")
        return JSONResponse(
            status_code=409,
            content={"error": "Conflit de données (valeur déjà existante)."},
        )

    @app.exception_handler(SQLAlchemyError)
    async def db_error_handler(request: Request, exc: SQLAlchemyError):
        logger.error(f"Database error: {exc}")
        return JSONResponse(
            status_code=503,
            content={"error": "Erreur de base de données. Réessayez plus tard."},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Filet de sécurité — ne jamais renvoyer une stack trace brute au frontend
        logger.exception(f"Erreur non gérée sur {request.method} {request.url.path}")
        return JSONResponse(
            status_code=500,
            content={"error": "Une erreur interne est survenue."},
        )