import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiTrash2,
  FiCpu,
} from "react-icons/fi";
import {
  getProject,
  deployProject,
  addEnvVar,
  removeEnvVar,
  deleteProject,
} from "../../services/projectService.js";
import { getStatusLabel } from "../../constants/status.js";
import { useDeploymentStatus } from "../../hooks/useDeploymentStatus.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./ProjectDetail.css";

const tabs = [
  { id: "overview", label: "Aperçu" },
  { id: "deployments", label: "Déploiements" },
  { id: "settings", label: "Paramètres" },
];

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [redeploying, setRedeploying] = useState(false);
  const [activeDeploymentId, setActiveDeploymentId] = useState(null);
  const [revealedVars, setRevealedVars] = useState({});
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const [envVars, setEnvVars] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { status: liveStatus, message: liveMessage } = useDeploymentStatus(activeDeploymentId);

  useEffect(() => {
    getProject(id)
      .then((data) => {
        setProject(data);
        setEnvVars(data.env_vars || []);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!liveStatus) return;

    if (liveStatus === "success") {
      setRedeploying(false);
      toast.success("Déploiement réussi !");
      getProject(id).then((data) => {
        setProject(data);
        setEnvVars(data.env_vars || []);
      });
    }

    if (liveStatus === "failed") {
      setRedeploying(false);
      if (liveMessage && liveMessage.includes("Impossible de détecter le type de projet")) {
        toast.error("Type de projet non détecté — configuration manuelle nécessaire.");
        navigate(`/projects/${id}/build-config`);
      } else {
        toast.error("Le déploiement a échoué.");
      }
    }

    if (liveStatus === "diagnosed") {
      getProject(id).then((data) => {
        setProject(data);
        setEnvVars(data.env_vars || []);
      });
    }
  }, [liveStatus]);

  if (loading) {
    return (
      <div className="project-detail">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail">
        <p className="pd-not-found">Projet introuvable.</p>
        <button className="btn btn-outline" onClick={() => navigate("/projects")}>
          Retour aux projets
        </button>
      </div>
    );
  }

  const handleRedeploy = async () => {
    setRedeploying(true);
    try {
      const deployment = await deployProject(id);
      setActiveDeploymentId(deployment.id);
      toast.success("Déploiement lancé.");
    } catch (err) {
      toast.error(err.message);
      setRedeploying(false);
    }
  };

  const toggleReveal = (key) => {
    setRevealedVars((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddVar = async (e) => {
    e.preventDefault();
    if (!newVarKey.trim()) return;
    try {
      await addEnvVar(id, newVarKey, newVarValue, true);
      setEnvVars((prev) => [...prev, { key: newVarKey, value: newVarValue, is_secret: true }]);
      setNewVarKey("");
      setNewVarValue("");
      toast.success("Variable ajoutée.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveVar = async (key) => {
    try {
      await removeEnvVar(id, key);
      setEnvVars((prev) => prev.filter((v) => v.key !== key));
      toast.success("Variable supprimée.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject(id);
      toast.success("Projet supprimé.");
      navigate("/projects");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deployments = project.deployments || [];
  const lastFailedDeployment = deployments.find((d) => d.status === "failed");
  const showLiveBanner = liveStatus && liveStatus !== "success" && liveStatus !== "diagnosed";

  return (
    <div className="project-detail">
      <header className="pd-header">
        <div>
          <button className="pd-back" onClick={() => navigate("/projects")}>
            <FiArrowLeft size={12} /> Projets
          </button>
          <div className="pd-title-row">
            <p className="pd-title">{project.name}</p>
            <span className={`badge badge-${project.status}`}>{getStatusLabel(project.status)}</span>
          </div>
          <p className="pd-meta">
            {project.repo_url || "Source : archive locale"} · {project.language || "?"} / {project.framework || "?"}
          </p>
        </div>
        <div className="pd-actions">
          <button
            className="btn btn-outline"
            onClick={() => navigate(`/projects/${id}/build-config`)}
          >
            <FiCpu size={15} />
            Configuration
          </button>
          <button className="btn btn-outline" onClick={handleRedeploy} disabled={redeploying}>
            <FiRefreshCw size={15} className={redeploying ? "spin" : ""} />
            {redeploying ? "Redéploiement..." : "Redéployer"}
          </button>
          <button
            className="btn btn-accent"
            disabled={!project.url}
            onClick={() => project.url && window.open(project.url, "_blank", "noopener,noreferrer")}
            title={project.url || "Application indisponible"}
          >
            <FiExternalLink size={15} />
            Ouvrir l'app
          </button>
        </div>
      </header>

      {showLiveBanner && (
        <div className={`pd-live-banner status-${liveStatus}`}>
          <span className="pd-live-dot" />
          {liveMessage || "Déploiement en cours..."}
        </div>
      )}

      <nav className="pd-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={activeTab === t.id ? "pd-tab active" : "pd-tab"}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="pd-content">
        {activeTab === "overview" && (
          <div className="pd-overview">
            <div className="pd-stats-grid">
              <div className="pd-stat">
                <p className="pd-stat-label">Déploiements totaux</p>
                <p className="pd-stat-value">{project.stats.total}</p>
              </div>
              <div className="pd-stat">
                <p className="pd-stat-label">Taux de succès</p>
                <p className="pd-stat-value text-success">{project.stats.success_rate}</p>
              </div>
              <div className="pd-stat">
                <p className="pd-stat-label">Temps de build moyen</p>
                <p className="pd-stat-value">
                  {project.stats.avg_build_seconds ? `${Math.round(project.stats.avg_build_seconds)}s` : "—"}
                </p>
              </div>
            </div>

            {project.status === "failed" && lastFailedDeployment && (
              <div className="pd-failed-banner">
                <FiCpu size={16} />
                Le dernier déploiement a échoué.
                <button
                  className="link-btn"
                  onClick={() => navigate(`/diagnostics?deployment=${lastFailedDeployment.id}`)}
                >
                  Voir le diagnostic IA
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "deployments" && (
          <div className="pd-deployments">
            {deployments.map((d) => (
              <div key={d.id} className={`pd-deploy-row status-${d.status}`}>
                <div className="pd-deploy-left">
                  <span className={`badge badge-${d.status}`}>{getStatusLabel(d.status)}</span>
                  <span>#{d.id}</span>
                </div>
                <div className="pd-deploy-right">
                  {d.duration_seconds != null && <span>{d.duration_seconds}s</span>}
                  <span>{new Date(d.started_at).toLocaleString()}</span>
                  {d.status === "failed" ? (
                    <button
                      className="link-btn"
                      onClick={() => navigate(`/diagnostics?deployment=${d.id}`)}
                    >
                      Diagnostic
                    </button>
                  ) : (
                    <button
                      className="link-btn"
                      onClick={() => navigate(`/deployments?project=${project.id}`)}
                    >
                      Logs
                    </button>
                  )}
                </div>
                {d.status === "success" && d.preview_urls && d.preview_urls.length > 0 && (
                  <div className="pd-deploy-preview-links">
                    {d.preview_urls.map((p) => (
                      <a
                        key={p.url}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pd-deploy-preview-link"
                      >
                        <FiExternalLink size={12} />
                        {p.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {deployments.length === 0 && (
              <p className="pd-not-found">Aucun déploiement pour l'instant.</p>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="pd-settings">
            <p className="pd-section-title">Variables d'environnement</p>
            <div className="env-list">
              {envVars.map((v) => (
                <div key={v.key} className="env-row">
                  <span className="env-key">{v.key}</span>
                  <span className="env-value">
                    {v.is_secret && !revealedVars[v.key] ? "••••••••••••" : v.value}
                  </span>
                  <div className="env-row-actions">
                    {v.is_secret && (
                      <button className="icon-btn" onClick={() => toggleReveal(v.key)}>
                        {revealedVars[v.key] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    )}
                    <button className="icon-btn danger" onClick={() => handleRemoveVar(v.key)}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {envVars.length === 0 && (
                <p className="env-empty">Aucune variable d'environnement définie.</p>
              )}
            </div>

            <form className="env-add-form" onSubmit={handleAddVar}>
              <input
                type="text"
                placeholder="CLÉ"
                value={newVarKey}
                onChange={(e) => setNewVarKey(e.target.value.toUpperCase())}
              />
              <input
                type="text"
                placeholder="valeur"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
              />
              <button type="submit" className="btn btn-outline btn-sm">
                <FiPlus size={14} /> Ajouter
              </button>
            </form>

            <div className="danger-zone">
              <p className="pd-section-title">Zone de danger</p>
              <p className="danger-desc">
                Cette action supprime définitivement le projet et son historique de déploiements.
                Tape <b>{project.name}</b> pour confirmer.
              </p>
              <div className="danger-form">
                <input
                  type="text"
                  placeholder={project.name}
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
                <button
                  className="btn btn-danger"
                  disabled={deleteConfirm !== project.name}
                  onClick={handleDeleteProject}
                >
                  Supprimer le projet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;