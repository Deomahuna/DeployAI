import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiChevronRight, FiChevronDown, FiCpu } from "react-icons/fi";
import { listDeployments, getDiagnosis } from "../../services/deploymentService.js";
import { listProjects } from "../../services/projectService.js";
import { getStatusLabel } from "../../constants/status.js";
import { useDeploymentStatus } from "../../hooks/useDeploymentStatus.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./Deployments.css";

function DiagnosisPreview({ deploymentId, navigate }) {
  const [diagnosis, setDiagnosis] = useState(null);

  useEffect(() => {
    getDiagnosis(deploymentId).then(setDiagnosis).catch(() => {});
  }, [deploymentId]);

  if (!diagnosis) return null;

  return (
    <div className="diagnosis-preview">
      <div className="diagnosis-preview-header">
        <FiCpu size={15} />
        <span>Diagnostic IA</span>
        <span className="confidence-tag">{Math.round(diagnosis.confidence * 100)}% confiance</span>
      </div>
      <p className="diagnosis-cause">{diagnosis.cause}</p>
      <button className="btn btn-ai" onClick={() => navigate(`/diagnostics?deployment=${deploymentId}`)}>
        Voir le diagnostic complet
      </button>
    </div>
  );
}

function DeploymentRow({ deployment, projectName, isOpen, onToggle, navigate }) {
  const isLive = deployment.status === "queued" || deployment.status === "running";
  const { status: liveStatus, message: liveMessage } = useDeploymentStatus(isLive ? deployment.id : null);

  const displayStatus = liveStatus || deployment.status;
  const displayLabel = isLive && liveMessage ? liveMessage : getStatusLabel(displayStatus);

  return (
    <div className={`deployment-row status-${displayStatus}`}>
      <button className="deployment-summary" onClick={() => onToggle(deployment.id)}>
        <div className="deployment-summary-left">
          {isOpen ? <FiChevronDown size={15} /> : <FiChevronRight size={15} />}
          <span className="deployment-project">{projectName}</span>
          <span className={`badge badge-${displayStatus}`}>
            {isLive && <span className="live-dot" />}
            {displayLabel}
          </span>
        </div>
        <div className="deployment-summary-right">
          <span>#{deployment.id}</span>
          {deployment.duration_seconds != null && <span>{deployment.duration_seconds}s</span>}
          <span>{new Date(deployment.started_at).toLocaleString()}</span>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="deployment-logs">
            {(deployment.logs || "Aucun log disponible.").split("\n").map((line, i) => (
              <div
                key={i}
                className={`log-line ${displayStatus === "failed" ? "log-error" : ""}`}
              >
                {line}
              </div>
            ))}
          </div>

          {displayStatus === "failed" && (
            <DiagnosisPreview deploymentId={deployment.id} navigate={navigate} />
          )}
        </>
      )}
    </div>
  );
}

function Deployments() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get("project");

  const [projects, setProjects] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialProjectId ? Number(initialProjectId) : "all");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((err) => toast.error(err.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    listDeployments(filter === "all" ? null : filter)
      .then((data) => {
        setDeployments(data);
        const firstFailed = data.find((d) => d.status === "failed");
        setOpenId(firstFailed ? firstFailed.id : null);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  const toggleRow = (id) => {
    setOpenId((current) => (current === id ? null : id));
  };

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : `Projet #${projectId}`;
  };

  return (
    <div className="deployments">
      <header className="deployments-header">
        <p className="deployments-title">Déploiements</p>
        <p className="deployments-subtitle">Historique complet de tous tes projets</p>
      </header>

      <div className="deployments-body">
        <div className="project-chips">
          <button
            className={filter === "all" ? "chip active" : "chip"}
            onClick={() => setFilter("all")}
          >
            Tous
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              className={filter === p.id ? "chip active" : "chip"}
              onClick={() => setFilter(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="deployments-list">
            {deployments.map((d) => (
              <DeploymentRow
                key={d.id}
                deployment={d}
                projectName={getProjectName(d.project_id)}
                isOpen={openId === d.id}
                onToggle={toggleRow}
                navigate={navigate}
              />
            ))}

            {deployments.length === 0 && (
              <p className="deployments-empty">Aucun déploiement pour ce projet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Deployments;