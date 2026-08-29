# =====================================================
# IMAGE DE BASE
# =====================================================
# On utilise une image officielle Python.
# Cette image contient déjà Python installé.
FROM python:3.12-slim


# =====================================================
# DOSSIER DE TRAVAIL DANS LE CONTENEUR
# =====================================================
# Tous les fichiers de notre application seront placés
# dans le dossier /app à l'intérieur du conteneur Docker.
WORKDIR /app


# =====================================================
# COPIE DES DEPENDANCES
# =====================================================
# On copie le fichier requirements.txt dans le conteneur.
# Ce fichier contient toutes les bibliothèques nécessaires
# à DeployAI (FastAPI, SQLAlchemy, PostgreSQL...).
COPY requirements.txt .


# =====================================================
# INSTALLATION DES BIBLIOTHEQUES
# =====================================================
# Installation automatique des dépendances Python.
# Docker installe FastAPI, Uvicorn, SQLAlchemy, etc.
RUN pip install --no-cache-dir -r requirements.txt


# =====================================================
# COPIE DU CODE SOURCE
# =====================================================
# On copie tout le projet DeployAI dans le conteneur.
# Cela inclut :
# - main.py
# - routers/
# - models/
# - services/
# - database.py
# - schemas.py
COPY . .


# =====================================================
# OUVERTURE DU PORT
# =====================================================
# FastAPI fonctionne par défaut sur le port 8000.
# Cette instruction indique que le conteneur utilise ce port.
EXPOSE 8000


# =====================================================
# COMMANDE DE DEMARRAGE
# =====================================================
# Lorsque le conteneur démarre, cette commande lance
# automatiquement notre API FastAPI.
#
# main:app signifie :
# - fichier main.py
# - variable app = FastAPI()
#
# --host 0.0.0.0 permet d'accéder à l'application
# depuis l'extérieur du conteneur.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]