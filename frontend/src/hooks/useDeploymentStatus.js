import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

const TERMINAL_STATUSES = ["success", "failed"];

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

      if (TERMINAL_STATUSES.includes(data.status)) {
        socket.close();
      }
    };

    socket.onerror = () => {
      // Connexion échouée — les données déjà chargées via l'API restent affichées
    };

    return () => socket.close();
  }, [deploymentId]);

  return { status, message, logs };
}