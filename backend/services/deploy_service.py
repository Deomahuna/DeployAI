# =====================================================
# Service de gestion des déploiements DeployAI
# =====================================================

import os
import subprocess
import tempfile

from sqlalchemy.orm import Session

from models.deployment import Deployment
from models.project import Project
from services.log_service import LogService
from services.ai_service import AIService


class DeployService:

    def __init__(self):
        self.log_service = LogService()
        self.ai_service = AIService()


    # =====================================================
    # Lancer un déploiement
    # =====================================================

    def lancer_deploiement(
        self,
        project_id: int,
        db: Session
    ):

        # -------------------------------------------------
        # Récupérer le projet
        # -------------------------------------------------

        projet = db.query(Project).filter(
            Project.id == project_id
        ).first()

        if projet is None:

            return {
                "statut": "ECHEC",
                "message": "Projet introuvable."
            }


        # -------------------------------------------------
        # Vérifier l'URL GitHub
        # -------------------------------------------------

        if not projet.github_url:

            return {
                "statut": "ECHEC",
                "message": (
                    "Aucune URL GitHub n'est associée "
                    "à ce projet."
                )
            }


        # -------------------------------------------------
        # Créer le déploiement
        # -------------------------------------------------

        nouveau_deploiement = Deployment(
            project_id=project_id,
            environnement="Docker",
            statut="EN_COURS",
            logs=""
        )

        db.add(nouveau_deploiement)
        db.commit()
        db.refresh(nouveau_deploiement)


        logs = []


        try:

            logs.append(
                f"Début du déploiement du projet "
                f"{projet.nom_projet}"
            )


            # =================================================
            # 1. Vérifier Docker
            # =================================================

            logs.append(
                "Vérification de Docker..."
            )

            docker = subprocess.run(
                [
                    "docker",
                    "--version"
                ],
                capture_output=True,
                text=True,
                timeout=30
            )


            if docker.returncode != 0:

                raise Exception(
                    "Docker n'est pas disponible "
                    "sur cette machine."
                )


            logs.append(
                docker.stdout.strip()
            )


            # =================================================
            # 2. Préparer le dossier temporaire
            # =================================================

            dossier_projet = tempfile.mkdtemp(
                prefix="deployai_"
            )


            logs.append(
                "Dossier temporaire créé."
            )


            # =================================================
            # 3. Cloner le projet GitHub
            # =================================================

            logs.append(
                "Clonage du projet GitHub..."
            )


            # Chemin exact de Git sur Windows
            git_executable = (
                r"C:\Program Files\Git\cmd\git.exe"
            )


            # Vérifier que Git existe
            if not os.path.exists(git_executable):

                raise Exception(
                    "Git est introuvable à l'emplacement : "
                    + git_executable
                )


            logs.append(
                "Git trouvé : "
                + git_executable
            )


            # Exécuter Git Clone
            git = subprocess.run(
                [
                    git_executable,
                    "clone",
                    projet.github_url,
                    dossier_projet
                ],
                capture_output=True,
                text=True,
                timeout=120
            )


            # Vérifier le résultat
            if git.returncode != 0:

                erreur_git = (
                    git.stderr.strip()
                    or git.stdout.strip()
                    or "Impossible de cloner le projet GitHub."
                )

                raise Exception(
                    erreur_git
                )


            logs.append(
                "Projet GitHub cloné avec succès."
            )


            # =================================================
            # 4. Vérifier le Dockerfile
            # =================================================

            dockerfile = os.path.join(
                dossier_projet,
                "Dockerfile"
            )


            if not os.path.isfile(dockerfile):

                raise Exception(
                    "Dockerfile introuvable dans "
                    "le projet GitHub."
                )


            logs.append(
                "Dockerfile trouvé."
            )


            # =================================================
            # 5. Construire l'image Docker
            # =================================================

            image_name = (
                f"deployai-project-{project_id}"
            )


            logs.append(
                "Construction de l'image Docker..."
            )


            build = subprocess.run(
                [
                    "docker",
                    "build",
                    "-t",
                    image_name,
                    dossier_projet
                ],
                capture_output=True,
                text=True,
                timeout=600
            )


            # Ajouter les informations Docker
            if build.stdout.strip():

                logs.append(
                    build.stdout.strip()
                )


            if build.returncode != 0:

                erreur_docker = (
                    build.stderr.strip()
                    or build.stdout.strip()
                    or (
                        "Erreur lors de la construction "
                        "Docker."
                    )
                )

                raise Exception(
                    erreur_docker
                )


            logs.append(
                "Image Docker construite avec succès."
            )


            logs.append(
                f"Image créée : {image_name}"
            )


            # =================================================
            # 6. Déploiement réussi
            # =================================================

            nouveau_deploiement.statut = "SUCCES"

            nouveau_deploiement.logs = (
                "\n".join(logs)
            )

            db.commit()
            db.refresh(nouveau_deploiement)


            return {

                "deployment_id":
                    nouveau_deploiement.id,

                "projet":
                    projet.nom_projet,

                "statut":
                    "SUCCES",

                "message":
                    "Déploiement effectué avec succès.",

                "logs":
                    nouveau_deploiement.logs

            }


        except subprocess.TimeoutExpired as erreur:

            # -------------------------------------------------
            # Commande trop longue
            # -------------------------------------------------

            message_erreur = (
                "Le déploiement a dépassé "
                "le temps maximal autorisé."
            )


            logs.append(
                "ERREUR : "
                + message_erreur
            )


            diagnostic = (
                self.ai_service.analyser_erreur(
                    message_erreur
                )
            )


            nouveau_deploiement.statut = "ECHEC"

            nouveau_deploiement.logs = (
                "\n".join(logs)
            )

            db.commit()
            db.refresh(nouveau_deploiement)


            return {

                "deployment_id":
                    nouveau_deploiement.id,

                "projet":
                    projet.nom_projet,

                "statut":
                    "ECHEC",

                "message":
                    "Le déploiement a échoué.",

                "logs":
                    nouveau_deploiement.logs,

                "diagnostic":
                    diagnostic

            }


        except Exception as erreur:

            # -------------------------------------------------
            # Erreur de déploiement
            # -------------------------------------------------

            message_erreur = str(
                erreur
            )


            logs.append(
                "ERREUR : "
                + message_erreur
            )


            # -------------------------------------------------
            # Analyse avec l'IA
            # -------------------------------------------------

            diagnostic = (
                self.ai_service.analyser_erreur(
                    message_erreur
                )
            )


            # -------------------------------------------------
            # Enregistrer l'échec
            # -------------------------------------------------

            nouveau_deploiement.statut = "ECHEC"

            nouveau_deploiement.logs = (
                "\n".join(logs)
            )

            db.commit()
            db.refresh(nouveau_deploiement)


            return {

                "deployment_id":
                    nouveau_deploiement.id,

                "projet":
                    projet.nom_projet,

                "statut":
                    "ECHEC",

                "message":
                    "Le déploiement a échoué.",

                "logs":
                    nouveau_deploiement.logs,

                "diagnostic":
                    diagnostic

            }