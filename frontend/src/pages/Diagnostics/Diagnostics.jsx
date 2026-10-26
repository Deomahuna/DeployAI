import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCpu, FiCopy, FiCheck } from "react-icons/fi";
import {
  getDiagnosis,
  resolveDiagnostic,
  listDeployments,
} from "../../services/deploymentService.js";
import { listProjects } from "../../services/projectService.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./Diagnostics.css";

const severityLabels = {
  low: "faible",
  medium: "moyenne",
  high: "élevée",
  critical: "critique",
};

function Diagnostics() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const deploymentId = Number(searchParams.get("deployment"));

  const [diagnostic, setDiagnostic] = useState(null);
  const [deployment, setDeployment] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [failedDeployments, setFailedDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [copiedIndex, setCopiedIndex] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!deploymentId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    Promise.all([listDeployments(), listProjects()])
      .then(([deployments, projects]) => {
        const current = deployments.find((d) => d.id === deploymentId);
        setDeployment(current || null);

        if (current) {
          const project = projects.find((p) => p.id === current.project_id);
          setProjectName(
            project ? project.name : `Projet #${current.project_id}`,
          );
        }

        setFailedDeployments(
          deployments.filter(
            (d) => d.status === "failed" && d.id !== deploymentId,
          ),
        );

        return getDiagnosis(deploymentId);
      })
      .then(setDiagnostic)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [deploymentId]);

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // Presse-papiers indisponible - on ignore silencieusement
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveDiagnostic(deploymentId);
      toast.success("Correction appliquée, redéploiement terminé.");
      setDiagnostic((prev) => ({ ...prev, resolved: true }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="diagnostics">
        <p>Chargement...</p>
      </div>
    );
  }

  if (notFound || !diagnostic) {
    return (
      <div className="diagnostics">
        <header className="diagnostics-header">
          <p className="diagnostics-title">Diagnostics IA</p>
        </header>
        <div className="diagnostics-body">
          <p className="diagnostics-empty">
            Aucun diagnostic disponible pour ce déploiement.
          </p>
        </div>
      </div>
    );
  }

  const timeline = [
    {
      label: "Déploiement lancé",
      time: deployment?.started_at,
      status: "done",
    },
    { label: "Échec détecté", time: deployment?.finished_at, status: "error" },
    {
      label: "Diagnostic IA généré",
      time: diagnostic.created_at,
      status: "done",
    },
    diagnostic.resolved
      ? {
          label: "Corrigé et redéployé",
          time: diagnostic.resolved_at,
          status: "success",
        }
      : { label: "En attente de correction", time: null, status: "pending" },
  ];

  return (
    <div className="diagnostics">
      <header className="diagnostics-header">
        <p className="diagnostics-title">Diagnostics IA</p>
        <p className="diagnostics-subtitle">
          {projectName} · déploiement #{deploymentId}
        </p>
      </header>

      <div className="diagnostics-body">
        <div className="diagnosis-card">
          <div className="diagnosis-card-top">
            <div className="diagnosis-card-label">
              <FiCpu size={19} />
              <span>Erreur détectée</span>
            </div>
            <div className="diagnosis-tags">
              <span className={`tag-severity severity-${diagnostic.severity}`}>
                Gravité :{" "}
                {severityLabels[diagnostic.severity] || diagnostic.severity}
              </span>
              <span className="tag-confidence">
                {Math.round(diagnostic.confidence * 100)}% confiance
              </span>
            </div>
          </div>

          <div className="error-block">
            {deployment?.logs || "Erreur non disponible."}
          </div>

          <p className="section-label">Cause probable</p>
          <p className="cause-text">{diagnostic.cause}</p>

          <p className="section-label">Solutions recommandées</p>
          <div className="solutions-list">
            {diagnostic.solutions.map((s, i) => (
              <div key={i} className="solution-row">
                <div>
                  <p className="solution-title">{s.title}</p>
                  {s.command && <p className="solution-command">{s.command}</p>}
                </div>
                {s.command && (
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(s.command, i)}
                    aria-label="Copier la commande"
                  >
                    {copiedIndex === i ? (
                      <FiCheck size={16} />
                    ) : (
                      <FiCopy size={16} />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {!diagnostic.resolved && (
            <div className="diagnosis-actions">
              <button
                className="btn btn-accent"
                onClick={handleResolve}
                disabled={resolving}
              >
                {resolving
                  ? "Redéploiement en cours..."
                  : "Marquer comme résolu et redéployer"}
              </button>
              <button
                className="btn btn-outline"
                onClick={() =>
                  navigate(`/deployments?project=${deployment?.project_id}`)
                }
              >
                Voir les logs complets
              </button>
            </div>
          )}
          {diagnostic.resolved && (
            <div className="resolved-banner">
              <FiCheck size={16} />
              Résolu - le processus complet est visible dans la timeline
              ci-dessous
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate("/deployments")}
              >
                Retour aux déploiements
              </button>
            </div>
          )}
        </div>

        <div>
          <p className="section-title">
            Processus jusqu'à{" "}
            {diagnostic.resolved ? "la résolution" : "maintenant"}
          </p>
          <div className="timeline">
            {timeline.map((step, i) => (
              <div key={i} className={`timeline-step step-${step.status}`}>
                <span className="timeline-dot" />
                <div className="timeline-content">
                  <p className="timeline-label">{step.label}</p>
                  <p className="timeline-time">
                    {step.time ? new Date(step.time).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="section-title">Autres déploiements en échec</p>
          <div className="history-list">
            {failedDeployments.map((d) => (
              <button
                key={d.id}
                className="history-row"
                onClick={() => navigate(`/diagnostics?deployment=${d.id}`)}
              >
                <div>
                  <span className="history-project">Déploiement #{d.id}</span>
                  <span className="history-summary">
                    {new Date(d.started_at).toLocaleString()}
                  </span>
                </div>
                <span className="history-status">En attente</span>
              </button>
            ))}
            {failedDeployments.length === 0 && (
              <p className="deployments-empty">
                Aucun autre déploiement en échec.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Diagnostics;
