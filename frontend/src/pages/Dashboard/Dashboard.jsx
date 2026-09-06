import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiBox } from "react-icons/fi";
import { getSummary } from "../../services/dashboardService.js";
import { getProfile } from "../../services/userService.js";
import { getStatusLabel } from "../../constants/status.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSummary(), getProfile()])
      .then(([summaryData, profile]) => {
        setSummary(summaryData);
        setUserName(profile.full_name);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    { label: "Projets actifs", value: summary.stats.active_projects },
    { label: "Déploiements ce mois", value: summary.stats.deployments_this_month },
    { label: "Taux de succès", value: summary.stats.success_rate, tone: "success" },
    { label: "Erreurs résolues par l'IA", value: summary.stats.ai_resolved_errors, tone: "ai" },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-title">Tableau de bord</p>
          <p className="dashboard-subtitle">Bon retour, {userName}</p>
        </div>
        <button className="btn btn-accent" onClick={() => navigate("/import")}>
          <FiPlus size={15} />
          Nouveau projet
        </button>
      </header>

      <div className="dashboard-body">
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className={`stat-card ${s.tone ? `stat-${s.tone}` : ""}`}>
              <p className="stat-label">{s.label}</p>
              <p className={`stat-value ${s.tone ? `text-${s.tone}` : ""}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="section-title">Activité récente</p>
          <div className="activity-list">
            {summary.activity.length === 0 && (
              <p className="activity-empty">Aucune activité récente.</p>
            )}
            {summary.activity.map((item, i) => (
              <div key={i} className={`activity-row activity-${item.status}`}>
                <div className="activity-info">
                  <FiBox size={17} className="activity-icon" />
                  <span className="activity-name">{item.project_name}</span>
                  <span className={`badge badge-${item.status}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <span className="activity-time">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;