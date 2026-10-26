import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

// "failed" n'est volontairement PAS ici : le backend enchaîne toujours
// "failed" -> "diagnosing" -> "diagnosed" pour un déploiement raté. Fermer
// le socket dès "failed" empêchait de recevoir "diagnosing"/"diagnosed",
// donc l'UI ne montrait jamais l'état "diagnostic en cours" et le
// diagnostic ne semblait apparaître que par un fetch REST séparé, en
// silence, une fois prêt.
const WS_CLOSING_STATUSES = ["success", "diagnosed"];

export function useDeploymentStatus(deploymentId) {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!deploymentId) return;

    setStatus(null);
    setMessage("");
    setLogs([]);

    const wsUrl = API_URL.replace("http", "ws");
    const socket = new WebSocket(`${wsUrl}/ws/deployments/${deploymentId}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "log") {
        setLogs((prev) => [...prev, data.message]);
        return;
      }

      setStatus(data.status);
      setMessage(data.message);

      if (WS_CLOSING_STATUSES.includes(data.status)) {
        socket.close();
      }
    };

    socket.onerror = () => {
      // Connexion échouée - les données déjà chargées via l'API restent affichées
    };

    return () => socket.close();
  }, [deploymentId]);

  return { status, message, logs };
}
