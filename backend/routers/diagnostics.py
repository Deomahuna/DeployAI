# Router de gestion des diagnostics

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from services.ai_service import AIService
from models.diagnostic import Diagnostic


router = APIRouter(
    prefix="/diagnostics",
    tags=["Diagnostics"]
)


# Création du service IA
ai_service = AIService()



# Analyser une erreur de déploiement
@router.post("/analyser")
def analyser_erreur(
    deployment_id: int,
    erreur: str,
    db: Session = Depends(get_db)
):
    # Analyse de l'erreur avec le service IA
    resultat = ai_service.generer_rapport(erreur)


    # Récupération des informations du diagnostic
    details = resultat["details"]


    # Création du diagnostic dans PostgreSQL
    nouveau_diagnostic = Diagnostic(

        deployment_id=deployment_id,

        type_erreur=details["type_erreur"],

        erreur=details["erreur_detectee"],

        solution=details["solution"],

        gravite=details["gravite"]
    )


    # Enregistrement dans la base
    db.add(nouveau_diagnostic)
    db.commit()
    db.refresh(nouveau_diagnostic)


    # Retour du résultat
    return resultat