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

export function importFromUrl(name, repoUrl) {
  return apiFetch("/projects/import-url", {
    method: "POST",
    body: JSON.stringify({ name, repo_url: repoUrl }),
  });
}

export async function importFromArchive(name, file) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("file", file);

  const token = localStorage.getItem("access_token");
  const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/import-archive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Échec de l'import." }));
    throw new Error(error.error);
  }
  return response.json();
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

export function analyzeRepo(repoUrl, branch = "main", subdirectory = null) {
  return apiFetch("/projects/analyze", {
    method: "POST",
    body: JSON.stringify({ repo_url: repoUrl, branch, subdirectory }),
  });
}