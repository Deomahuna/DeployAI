// =====================================================
// Service de communication avec l'API du dashboard
// =====================================================

import { apiFetch } from "./api.js";

export async function getDashboardStats() {
    return apiFetch("/dashboard/");
}