export const STATUS_LABELS = {
  pending: "En attente",
  queued: "En file d'attente",
  running: "En cours",
  success: "En ligne",
  failed: "Échec",
};

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}