import apiFetch from "./api";

export function listRepos(provider) {
  return apiFetch(`/import/repos?provider=${provider}`);
}

export function listBranches(provider, fullName) {
  return apiFetch(`/import/branches?provider=${provider}&full_name=${encodeURIComponent(fullName)}`);
}