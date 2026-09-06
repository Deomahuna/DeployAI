import apiFetch from "./api";

export function listDeployments(projectId = null) {
  const query = projectId ? `?project_id=${projectId}` : "";
  return apiFetch(`/deployments${query}`);
}

export function getDiagnosis(deploymentId) {
  return apiFetch(`/deployments/${deploymentId}/diagnosis`);
}

export function resolveDiagnostic(deploymentId) {
  return apiFetch(`/diagnostics/${deploymentId}/resolve`, { method: "POST" });
}