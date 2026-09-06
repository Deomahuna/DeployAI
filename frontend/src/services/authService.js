import apiFetch, { API_URL } from "./api";

export function login(email, password) {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function register(fullName, email, password) {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ full_name: fullName, email, password }) });
}

export function verifyOtp(email, code) {
  return apiFetch("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, code }) });
}

export function resendOtp(email) {
  return apiFetch("/auth/resend-otp", { method: "POST", body: JSON.stringify({ email }) });
}

export function forgotPassword(email) {
  return apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export function resetPassword(email, code, newPassword) {
  return apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code, new_password: newPassword }) });
}

export function saveToken(token) {
  localStorage.setItem("access_token", token);
}

export function logout() {
  localStorage.removeItem("access_token");
}

export function isAuthenticated() {
  return !!localStorage.getItem("access_token");
}

export function startGithubLogin() {
  window.location.href = `${API_URL}/auth/github/login`;
}

export function startGitlabLogin() {
  window.location.href = `${API_URL}/auth/gitlab/login`;
}