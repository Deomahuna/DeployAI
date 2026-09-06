import apiFetch from "./api";

export function getSummary() {
  return apiFetch("/dashboard/summary");
}