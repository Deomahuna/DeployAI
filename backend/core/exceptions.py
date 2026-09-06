class AppException(Exception):
    """Exception de base pour toutes les erreurs métier de DeployAI."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppException):
    def __init__(self, resource: str, identifier=None):
        msg = f"{resource} introuvable" + (f" (id={identifier})" if identifier else "")
        super().__init__(msg, status_code=404)


class AlreadyExistsError(AppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=409)


class InvalidCredentialsError(AppException):
    def __init__(self):
        super().__init__("Email ou mot de passe incorrect.", status_code=401)


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Accès non autorisé."):
        super().__init__(message, status_code=403)


class InvalidTokenError(AppException):
    def __init__(self, message: str = "Token invalide ou expiré."):
        super().__init__(message, status_code=401)


class DeploymentError(AppException):
    """Erreur pendant l'exécution du pipeline Docker (build/run)."""
    def __init__(self, message: str):
        super().__init__(message, status_code=500)


class ExternalProviderError(AppException):
    """Erreur venant de l'API GitHub/GitLab (token expiré, rate limit, etc.)."""
    def __init__(self, provider: str, detail: str):
        super().__init__(f"Erreur {provider} : {detail}", status_code=502)