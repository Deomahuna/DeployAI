import apiFetch, { API_URL, getToken } from "./api";

export function getIntegrations() {
  return apiFetch("/me/integrations");
}

export function disconnectIntegration(provider) {
  return apiFetch(`/me/integrations/${provider}`, { method: "DELETE" });
}

export function connectGithub() {
  window.location.href = `${API_URL}/auth/github/connect?token=${getToken()}`;
}

export function connectGitlab() {
  window.location.href = `${API_URL}/auth/gitlab/connect?token=${getToken()}`;
}