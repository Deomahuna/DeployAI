import apiFetch from "./api";

export function listRepos(provider) {
  return apiFetch(`/import/repos?provider=${provider}`);
}