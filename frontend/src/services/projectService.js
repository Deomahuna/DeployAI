// =====================================================
// Service de communication avec l'API des projets
// =====================================================

const API_URL = "http://127.0.0.1:8000";


// =====================================================
// Créer un projet
// =====================================================

export async function createProject(project) {

    const response = await fetch(`${API_URL}/projects/`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(project)

    });

    if (!response.ok) {

        const errorText = await response.text();

        throw new Error(
            `Erreur lors de la création du projet : ${errorText}`
        );

    }

    return await response.json();
}


// =====================================================
// Récupérer tous les projets
// =====================================================

export async function getProjects() {

    const response = await fetch(
        `${API_URL}/projects/`
    );

    if (!response.ok) {

        const errorText = await response.text();

        throw new Error(
            `Erreur lors de la récupération des projets : ${errorText}`
        );

    }

    return await response.json();
}


// =====================================================
// Modifier un projet
// =====================================================

export async function updateProject(
    projectId,
    project
) {

    const response = await fetch(
        `${API_URL}/projects/${projectId}`,
        {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(project)

        }
    );

    if (!response.ok) {

        const errorText = await response.text();

        throw new Error(
            `Erreur lors de la modification du projet : ${errorText}`
        );

    }

    return await response.json();
}


// =====================================================
// Supprimer un projet
// =====================================================

export async function deleteProject(projectId) {

    const response = await fetch(
        `${API_URL}/projects/${projectId}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {

        const errorText = await response.text();

        throw new Error(
            `Erreur lors de la suppression du projet : ${errorText}`
        );

    }

    return await response.json();
}