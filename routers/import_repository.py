# =====================================================
# Router d'importation d'une application
# =====================================================

from fastapi import APIRouter, UploadFile, File
import os
import shutil


router = APIRouter(
    prefix="/import",
    tags=["Importation"]
)


# =====================================================
# Importer une application
# =====================================================

@router.post("/")
async def import_application(
    file: UploadFile = File(...)
):

    # Dossier où seront stockés les fichiers importés
    upload_directory = "uploads"

    os.makedirs(
        upload_directory,
        exist_ok=True
    )

    # Chemin du fichier
    file_path = os.path.join(
        upload_directory,
        file.filename
    )

    # Enregistrer le fichier
    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    return {
        "message": "Application importée avec succès",
        "nom_fichier": file.filename,
        "chemin": file_path
    }