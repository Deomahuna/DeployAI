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

export async function importApplication(file) {

    // Création des données du formulaire
    const formData = new FormData();


    // Ajout du fichier sélectionné
    formData.append(
        "file",
        file
    );


    // Envoi du fichier vers FastAPI
    const response = await fetch(

        `${API_URL}/import/`,

        {
            // Notre route FastAPI utilise POST
            method: "POST",

            // Envoi du fichier
            body: formData
        }

    );


    // Vérification de la réponse du serveur
    if (!response.ok) {

        throw new Error(
            "Erreur lors de l'importation de l'application"
        );

    }


    // Récupération de la réponse JSON
    return await response.json();

}