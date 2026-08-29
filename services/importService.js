// =====================================================
// DeployAI - Service d'importation
// Fichier : importService.js
// Rôle : envoyer une application au backend FastAPI
// =====================================================


// =====================================================
// Adresse du backend FastAPI
// =====================================================

const API_URL = "http://127.0.0.1:8000";


// =====================================================
// Fonction d'importation d'une application
// =====================================================
//
// Cette fonction reçoit le fichier choisi par
// l'utilisateur dans le frontend.
// =====================================================

export async function importApplication(file) {


    // =================================================
    // Création d'un objet FormData
    // =================================================
    //
    // FormData permet d'envoyer un fichier au backend.
    // =================================================

    const formData = new FormData();


    // =================================================
    // Ajout du fichier dans FormData
    // =================================================
    //
    // "file" doit correspondre au nom attendu par
    // notre route FastAPI :
    //
    // file: UploadFile = File(...)
    // =================================================

    formData.append(
        "file",
        file
    );


    // =================================================
    // Envoi du fichier vers FastAPI
    // =================================================

    const response = await fetch(

        `${API_URL}/import/`,

        {
            // Méthode utilisée par notre route FastAPI
            method: "POST",

            // Données envoyées au backend
            body: formData
        }

    );


    // =================================================
    // Vérification de la réponse du serveur
    // =================================================

    if (!response.ok) {

        throw new Error(
            "Erreur lors de l'importation de l'application"
        );

    }


    // =================================================
    // Récupération de la réponse du backend
    // =================================================

    return await response.json();

}