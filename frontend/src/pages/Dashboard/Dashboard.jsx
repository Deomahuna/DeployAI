// =====================================================
// Page Dashboard — statistiques réelles de la plateforme
// =====================================================

import { useEffect, useState } from "react";
import { FiUsers, FiFolder, FiSend, FiActivity } from "react-icons/fi";

import { getDashboardStats } from "../../services/dashboardService.js";
import "./Dashboard.css";

const statCards = [
    { key: "utilisateurs", label: "Utilisateurs", icon: <FiUsers /> },
    { key: "projets", label: "Projets", icon: <FiFolder /> },
    { key: "deployements", label: "Déploiements", icon: <FiSend /> },
    { key: "diagnostics", label: "Diagnostics", icon: <FiActivity /> }
];

function Dashboard() {

    const [stats, setStats] = useState(null);
    const [erreur, setErreur] = useState(null);
    const [chargement, setChargement] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then((data) => {
                setStats(data);
                setChargement(false);
            })
            .catch((err) => {
                setErreur(err.message);
                setChargement(false);
            });
    }, []);

    return (
        <div className="dashboard">

            <h1>Tableau de bord DeployAI</h1>

            {chargement && (
                <p className="dashboard-status">
                    Chargement des statistiques...
                </p>
            )}

            {erreur && (
                <p className="dashboard-status dashboard-status-error">
                    Impossible de charger les statistiques : {erreur}
                </p>
            )}

            {stats && (
                <div className="dashboard-grid">
                    {statCards.map((card) => (
                        <div className="dashboard-card" key={card.key}>
                            <div className="dashboard-card-icon">
                                {card.icon}
                            </div>
                            <p className="dashboard-card-value">
                                {stats[card.key] ?? 0}
                            </p>
                            <p className="dashboard-card-label">
                                {card.label}
                            </p>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}

export default Dashboard;