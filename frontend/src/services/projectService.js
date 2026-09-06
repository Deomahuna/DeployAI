import apiFetch from "./api";

export function listProjects() {
  return apiFetch("/projects");
}

export function getProject(id) {
  return apiFetch(`/projects/${id}`);
}

export function importProject(payload) {
  return apiFetch("/projects/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deployProject(id) {
  return apiFetch(`/projects/${id}/deploy`, { method: "POST" });
}

export function deleteProject(id) {
  return apiFetch(`/projects/${id}`, { method: "DELETE" });
}

export function addEnvVar(projectId, key, value, isSecret = true) {
  return apiFetch(`/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify({ key, value, is_secret: isSecret }),
  });
}

export function removeEnvVar(projectId, key) {
  return apiFetch(`/projects/${projectId}/env/${key}`, { method: "DELETE" });
}

export function analyzeRepo(repoUrl) {
  return apiFetch("/projects/analyze", {
    method: "POST",
    body: JSON.stringify({ repo_url: repoUrl }),
  });
}