# =====================================================
# APPLICATION PRINCIPALE DEPLOYAI
# Fichier : main.py
# Rôle : démarrer l'application FastAPI
# =====================================================


# Importation de FastAPI
# FastAPI permet de créer notre API web
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware



# Importation des différents routeurs
# Chaque routeur contient les API d'une partie du projet

from routers import users
from routers import projects
from routers import deployments
from routers import diagnostics
from routers import auth
from routers import dashboard
from routers import import_repository

# =====================================================
# CREATION DE L'APPLICATION FASTAPI
# =====================================================

app = FastAPI(

    # Nom de notre plateforme
    title="DeployAI",

    # Description du projet
    description="""
    Plateforme intelligente de déploiement automatique
    et de diagnostic des erreurs basée sur l'IA.
    """,

    # Version de notre API
    version="1.0"

)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# CONNEXION DES ROUTES
# =====================================================

# Route des utilisateurs
# Exemple : création, affichage des utilisateurs

app.include_router(
    users.router
)



# Route des projets
# Exemple : créer un projet à déployer

app.include_router(
    projects.router
)

app.include_router(
    import_repository.router
)

# Route des déploiements
# Exemple : lancer un déploiement

app.include_router(
    deployments.router
)



# Route des diagnostics
# Exemple : analyser une erreur avec l'IA

app.include_router(
    diagnostics.router
)

app.include_router(
    auth.router
)

app.include_router(
    dashboard.router
)

# =====================================================
# ROUTE PRINCIPALE DE TEST
# =====================================================

@app.get("/")
def accueil():

    """
    Cette fonction vérifie que DeployAI fonctionne.
    Quand on ouvre :
    http://127.0.0.1:8000/

    elle retourne un message.
    """

    return {

        "message": "Bienvenue sur DeployAI",

        "statut": "Application opérationnelle"

    }