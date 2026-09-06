import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiChevronDown,
  FiMoreHorizontal,
  FiCpu,
  FiPlusCircle,
  FiEye,
  FiRefreshCw,
  FiFileText,
  FiTrash2,
} from "react-icons/fi";
import { listProjects, deployProject, deleteProject } from "../../services/projectService.js";
import { getStatusLabel } from "../../constants/status.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./Projects.css";

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "running", label: "En cours" },
  { value: "success", label: "En ligne" },
  { value: "failed", label: "Échec" },
];

function ProjectMenu({ project, onAction, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="project-menu" ref={menuRef}>
      <button onClick={() => onAction(project, "view")}>
        <FiEye size={14} /> Voir les détails
      </button>
      <button onClick={() => onAction(project, "redeploy")}>
        <FiRefreshCw size={14} /> Redéployer
      </button>
      <button onClick={() => onAction(project, "logs")}>
        <FiFileText size={14} /> Voir les logs
      </button>
      <button className="danger" onClick={() => onAction(project, "delete")}>
        <FiTrash2 size={14} /> Supprimer
      </button>
    </div>
  );
}

function Projects() {
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = async (project, action) => {
    setOpenMenuFor(null);
    switch (action) {
      case "view":
        navigate(`/projects/${project.id}`);
        break;

      case "redeploy":
        try {
          await deployProject(project.id);
          toast.success(`Déploiement lancé pour ${project.name}.`);
          navigate(`/deployments?project=${project.id}`);
        } catch (err) {
          toast.error(err.message);
        }
        break;

      case "logs":
        navigate(`/deployments?project=${project.id}`);
        break;

      case "delete":
        if (!window.confirm(`Supprimer définitivement "${project.name}" ?`)) return;
        try {
          await deleteProject(project.id);
          setProjects((prev) => prev.filter((p) => p.id !== project.id));
          toast.success(`${project.name} supprimé.`);
        } catch (err) {
          toast.error(err.message);
        }
        break;

      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="projects">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="projects">
      <header className="projects-header">
        <div>
          <p className="projects-title">Projets</p>
          <p className="projects-subtitle">{projects.length} projets connectés</p>
        </div>
        <button className="btn btn-accent" onClick={() => navigate("/import")}>
          <FiPlus size={15} />
          Nouveau projet
        </button>
      </header>

      <div className="projects-toolbar">
        <div className="search-field">
          <FiSearch size={15} />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="status-filter">
          <button
            className="status-filter-trigger"
            onClick={() => setStatusDropdownOpen((v) => !v)}
          >
            {statusOptions.find((o) => o.value === statusFilter).label}
            <FiChevronDown size={14} />
          </button>
          {statusDropdownOpen && (
            <div className="status-filter-menu">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={opt.value === statusFilter ? "active" : ""}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setStatusDropdownOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="projects-grid">
        {filtered.map((project) => (
          <div key={project.id} className={`project-card status-${project.status}`}>
            <div className="project-card-top">
              <div className="project-card-identity">
                <div className={`project-icon icon-${project.status}`}>
                  {(project.language || "??").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="project-name">{project.name}</p>
                  <p className="project-repo">{project.repo_url}</p>
                </div>
              </div>
              <span className={`badge badge-${project.status}`}>{getStatusLabel(project.status)}</span>
            </div>

            <div className="project-tags">
              {project.language && <span className="tag">{project.language}</span>}
              {project.framework && <span className="tag">{project.framework}</span>}
            </div>

            <div className="project-card-bottom">
              {project.status === "failed" ? (
                <span className="project-event event-failed">
                  <FiCpu size={13} /> Diagnostic IA prêt
                </span>
              ) : (
                <span className="project-event">
                  Créé le {new Date(project.created_at).toLocaleDateString()}
                </span>
              )}

              <div className="project-menu-wrap">
                <button
                  className="icon-btn"
                  onClick={() =>
                    setOpenMenuFor(openMenuFor === project.id ? null : project.id)
                  }
                  aria-label="Actions du projet"
                >
                  <FiMoreHorizontal size={16} />
                </button>
                {openMenuFor === project.id && (
                  <ProjectMenu
                    project={project}
                    onAction={handleAction}
                    onClose={() => setOpenMenuFor(null)}
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        <button className="project-card-new" onClick={() => navigate("/import")}>
          <FiPlusCircle size={26} />
          <span>Connecter un nouveau dépôt</span>
        </button>
      </div>
    </div>
  );
}

export default Projects;