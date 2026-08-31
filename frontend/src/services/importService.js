// =====================================================
// Service d'importation d'une application
// =====================================================

import { apiFetch } from "./api.js";

export async function importApplication(file) {

    const formData = new FormData();
    formData.append("file", file);

    return apiFetch("/import/", {
        method: "POST",
        body: formData
    });
}