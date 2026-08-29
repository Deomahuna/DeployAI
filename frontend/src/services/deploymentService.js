// =====================================================
// Service de communication avec l'API des déploiements
// =====================================================

const API_URL = "http://127.0.0.1:8000";


// =====================================================
// Récupérer tous les déploiements
// =====================================================

export async function getDeployments() {

    const response = await fetch(`${API_URL}/deployments/`);

    if (!response.ok) {
        throw new Error("Erreur lors de la récupération des déploiements");
    }

    return await response.json();
}


// =====================================================
// Créer / lancer un déploiement
// =====================================================

export async function createDeployment(deployment) {

    const response = await fetch(`${API_URL}/deployments/`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(deployment)
    });

    if (!response.ok) {
        throw new Error("Erreur lors du lancement du déploiement");
    }

    return await response.json();
}


// =====================================================
// Récupérer un déploiement
// =====================================================

export async function getDeployment(deploymentId) {

    const response = await fetch(
        `${API_URL}/deployments/${deploymentId}`
    );

    if (!response.ok) {
        throw new Error("Déploiement introuvable");
    }

    return await response.json();
}