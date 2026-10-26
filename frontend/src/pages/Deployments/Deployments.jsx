import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiChevronRight,
  FiChevronDown,
  FiCpu,
  FiExternalLink,
} from "react-icons/fi";
import {
  listDeployments,
  getDiagnosis,
} from "../../services/deploymentService.js";
import { listProjects } from "../../services/projectService.js";
import { getStatusLabel } from "../../constants/status.js";
import { useDeploymentStatus } from "../../hooks/useDeploymentStatus.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./Deployments.css";

const TERMINAL_STATUSES = ["success", "failed"];

function DiagnosisPreview({
  deploymentId,
  navigate,
  liveDiagnosisStatus,
  liveDiagnosisMessage,
}) {
  const [diagnosis, setDiagnosis] = useState(null);
  const [attempted, setAttempted] = useState(false);

  // On tente un fetch initial (cas d'un déploiement déjà en échec au
  // chargement de la page, où aucun WebSocket ne s'ouvre puisque
  // shouldListen ne se déclenche que pour queued/running).
  useEffect(() => {
    getDiagnosis(deploymentId)
      .then(setDiagnosis)
      .catch(() => {})
      .finally(() => setAttempted(true));
  }, [deploymentId]);

  // Puis on re-tente dès que le WebSocket confirme que le diagnostic est
  // prêt ("diagnosed"), pour le cas d'un déploiement qui vient d'échouer
  // en direct pendant que la page est ouverte.
  useEffect(() => {
    if (liveDiagnosisStatus === "diagnosed") {
      getDiagnosis(deploymentId)
        .then(setDiagnosis)
        .catch(() => {});
    }
  }, [liveDiagnosisStatus, deploymentId]);

  const isDiagnosing =
    liveDiagnosisStatus === "failed" || liveDiagnosisStatus === "diagnosing";

  if (!diagnosis && isDiagnosing) {
    return (
      <div className="diagnosis-preview diagnosis-pending">
        <div className="diagnosis-preview-header">
          <FiCpu size={15} />
          <span>Diagnostic IA</span>
        </div>
        <p className="diagnosis-cause">
          <span className="live-dot" />
          {liveDiagnosisMessage || "Analyse de l'erreur par l'IA en cours..."}
        </p>
      </div>
    );
  }

  if (!diagnosis) {
    // Pas de flux live (déploiement historique) et le fetch initial n'a
    // encore rien trouvé - on n'affiche rien tant qu'on n'a pas au moins
    // essayé une fois, pour éviter un flash vide inutile.
    if (!attempted) return null;
    return null;
  }

  return (
    <div className="diagnosis-preview">
      <div className="diagnosis-preview-header">
        <FiCpu size={15} />
        <span>Diagnostic IA</span>
        <span className="confidence-tag">
          {Math.round(diagnosis.confidence * 100)}% confiance
        </span>
      </div>
      <p className="diagnosis-cause">{diagnosis.cause}</p>
      <button
        className="btn btn-ai"
        onClick={() => navigate(`/diagnostics?deployment=${deploymentId}`)}
      >
        Voir le diagnostic complet
      </button>
    </div>
  );
}

function PreviewLinks({ previewUrls }) {
  if (!previewUrls || previewUrls.length === 0) return null;

  return (
    <div className="deployment-preview-links">
      {previewUrls.map((p) => (
        <a
          key={p.url}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="deployment-preview-link"
        >
          <FiExternalLink size={12} />
          {p.label}
        </a>
      ))}
    </div>
  );
}

// Le backend passe par plusieurs sous-statuts transitoires pendant un
// déploiement (cloning, analyzing, building, diagnosing, diagnosed) qui ne
// sont JAMAIS stockés tels quels en base (DeploymentStatus n'a que
// QUEUED/RUNNING/SUCCESS/FAILED) - ce sont des messages WebSocket éphémères.
// On les regroupe ici pour un affichage cohérent : les phases de travail
// actif affichent "running", les phases post-échec (diagnosing/diagnosed)
// restent affichées comme "failed" pour ne pas faire clignoter le badge.
const RAW_TO_DISPLAY_STATUS = {
  queued: "queued",
  running: "running",
  cloning: "running",
  analyzing: "running",
  building: "running",
  success: "success",
  failed: "failed",
  diagnosing: "failed",
  diagnosed: "failed",
};

// Phases où on considère le déploiement "en cours de travail actif" (point
// pulsant sur le badge). Ne couvre volontairement pas diagnosing/diagnosed :
// une fois "failed" atteint, le badge se fige, et c'est le panneau
// DiagnosisPreview qui affiche sa propre indication de progression.
const ACTIVE_WORK_STATUSES = [
  "queued",
  "running",
  "cloning",
  "analyzing",
  "building",
];

function DeploymentRow({
  deployment,
  projectName,
  isOpen,
  onToggle,
  navigate,
}) {
  const shouldListen =
    deployment.status === "queued" ||
    deployment.status === "running" ||
    deployment.status === "failed";
  const {
    status: liveStatus,
    message: liveMessage,
    logs: liveLogs,
  } = useDeploymentStatus(shouldListen ? deployment.id : null);

  const rawStatus = liveStatus || deployment.status;
  const displayStatus = RAW_TO_DISPLAY_STATUS[rawStatus] || rawStatus;

  const isLive = ACTIVE_WORK_STATUSES.includes(rawStatus);
  const displayLabel =
    isLive && liveMessage ? liveMessage : getStatusLabel(displayStatus);

  // Priorité aux logs reçus en direct dès qu'il y en a, quelle que soit la
  // phase exacte - c'est ce qui permet de suivre le build en temps réel au
  // lieu d'attendre le résultat final tout d'un coup.
  const displayLogs =
    liveLogs && liveLogs.length > 0
      ? liveLogs.join("\n")
      : deployment.logs || "Aucun log disponible.";

  return (
    <div className={`deployment-row status-${displayStatus}`}>
      <button
        className="deployment-summary"
        onClick={() => onToggle(deployment.id)}
      >
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
          {deployment.duration_seconds != null && (
            <span>{deployment.duration_seconds}s</span>
          )}
          <span>{new Date(deployment.started_at).toLocaleString()}</span>
        </div>
      </button>

      {isOpen && (
        <>
          {displayStatus === "success" && (
            <PreviewLinks previewUrls={deployment.preview_urls} />
          )}

          <div className="deployment-logs">
            {displayLogs.split("\n").map((line, i) => (
              <div
                key={i}
                className={`log-line ${displayStatus === "failed" ? "log-error" : ""}`}
              >
                {line}
              </div>
            ))}
          </div>

          {displayStatus === "failed" && (
            <DiagnosisPreview
              deploymentId={deployment.id}
              navigate={navigate}
              liveDiagnosisStatus={liveStatus}
              liveDiagnosisMessage={liveMessage}
            />
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
  const [filter, setFilter] = useState(
    initialProjectId ? Number(initialProjectId) : "all",
  );
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

  useEffect(() => {
    const hasActive = deployments.some(
      (d) => d.status === "queued" || d.status === "running",
    );
    if (!hasActive) return;

    const interval = setInterval(() => {
      listDeployments(filter === "all" ? null : filter)
        .then(setDeployments)
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [deployments, filter]);

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
        <p className="deployments-subtitle">
          Historique complet de tous tes projets
        </p>
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
              <p className="deployments-empty">
                Aucun déploiement pour ce projet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Deployments;
