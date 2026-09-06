import apiFetch, { API_URL, getToken } from "./api";

export function getProfile() {
  return apiFetch("/me");
}

export function updateProfile(fullName, email) {
  return apiFetch("/me", {
    method: "PATCH",
    body: JSON.stringify({ full_name: fullName, email }),
  });
}

export function updatePassword(newPassword) {
  return apiFetch("/me/password", {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword }),
  });
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Échec de l'upload." }));
    throw new Error(error.error);
  }

  return response.json();
}