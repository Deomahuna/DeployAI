import apiFetch from "./api";

export function getBuildConfig(projectId) {
  return apiFetch(`/projects/${projectId}/build-config`);
}

export function updateBuildConfig(projectId, config) {
  return apiFetch(`/projects/${projectId}/build-config`, {
    method: "PATCH",
    body: JSON.stringify(config),
  });
}