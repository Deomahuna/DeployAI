// =====================================================
// Configuration centrale des appels à l'API DeployAI
// =====================================================

export const API_URL = import.meta.env.VITE_API_URL;

// Wrapper générique autour de fetch : centralise la
// vérification du statut et l'extraction des erreurs,
// pour éviter de répéter ce bloc dans chaque service.
export async function apiFetch(path, options = {}) {

    const response = await fetch(`${API_URL}${path}`, options);

    if (!response.ok) {

        const errorText = await response.text();

        throw new Error(
            errorText || `Erreur API (${response.status}) sur ${path}`
        );

    }

    // Certaines routes (ex: DELETE) ne renvoient pas toujours du JSON
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }

    return null;
}