import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

export function useDeploymentStatus(deploymentId) {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!deploymentId) return;

    const wsUrl = API_URL.replace("http", "ws");
    const socket = new WebSocket(`${wsUrl}/ws/deployments/${deploymentId}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
      setMessage(data.message);
    };

    socket.onerror = () => {
      // Connexion échouée — les données déjà chargées via l'API restent affichées
    };

    return () => socket.close();
  }, [deploymentId]);

  return { status, message };
}