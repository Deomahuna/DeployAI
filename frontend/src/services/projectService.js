// =====================================================
// Service de communication avec l'API des projets
// =====================================================

import { apiFetch } from "./api.js";

export async function createProject(project) {
    return apiFetch("/projects/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project)
    });
}

export async function getProjects() {
    return apiFetch("/projects/");
}

export async function updateProject(projectId, project) {
    return apiFetch(`/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project)
    });
}

export async function deleteProject(projectId) {
    return apiFetch(`/projects/${projectId}`, {
        method: "DELETE"
    });
}