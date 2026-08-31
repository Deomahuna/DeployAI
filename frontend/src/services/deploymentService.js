// =====================================================
// Service de communication avec l'API des déploiements
// =====================================================

import { apiFetch } from "./api.js";

export async function getDeployments() {
    return apiFetch("/deployments/");
}

export async function createDeployment(deployment) {
    return apiFetch("/deployments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deployment)
    });
}

export async function getDeployment(deploymentId) {
    return apiFetch(`/deployments/${deploymentId}`);
}