import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiGithub,
  FiGitlab,
  FiCheckCircle,
  FiSearch,
  FiLock,
  FiUnlock,
  FiCpu,
} from "react-icons/fi";
import { getIntegrations, connectGithub, connectGitlab } from "../../services/oauthService.js";
import { listRepos } from "../../services/importService.js";
import { analyzeRepo, importProject } from "../../services/projectService.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./ImportRepository.css";

function ImportRepository() {
  const navigate = useNavigate();
  const toast = useToast();

  const [provider, setProvider] = useState("github");
  const [integrations, setIntegrations] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    getIntegrations()
      .then(setIntegrations)
      .catch((err) => toast.error(err.message));
  }, []);

  useEffect(() => {
    if (!integrations) return;
    const connected = integrations[provider]?.connected;
    if (!connected) {
      setRepos([]);
      return;
    }
    setLoadingRepos(true);
    listRepos(provider)
      .then(setRepos)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingRepos(false));
  }, [provider, integrations]);

  const isConnected = integrations?.[provider]?.connected;
  const account = integrations?.[provider]?.account;

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = () => {
    if (provider === "github") connectGithub();
    else connectGitlab();
  };

  const handleImport = async (repo) => {
    setSelectedRepo(repo);
    setAnalysis(null);
    setAnalyzing(true);
    try {
      const result = await analyzeRepo(
        `https://${provider === "github" ? "github.com" : "gitlab.com"}/${repo.full_name}`
      );
      setAnalysis(result);
    } catch (err) {
      toast.error(err.message);
      setSelectedRepo(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmDeploy = async () => {
    setDeploying(true);
    try {
      const project = await importProject({
        name: selectedRepo.name,
        repo_url: `https://${provider === "github" ? "github.com" : "gitlab.com"}/${selectedRepo.full_name}`,
        provider,
        repo_id: selectedRepo.id,
        language: analysis.language,
        framework: analysis.framework,
        dependencies_summary: analysis.dependencies_summary,
      });
      toast.success(`${project.name} importé avec succès.`);
      navigate("/deployments");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="import-page">
      <header className="import-header">
        <p className="import-title">Importer un dépôt</p>
        <p className="import-subtitle">
          Connectez un dépôt GitHub ou GitLab pour créer un nouveau projet
        </p>
      </header>

      <div className="import-body">
        <div className="provider-tabs">
          <button
            className={provider === "github" ? "active" : ""}
            onClick={() => {
              setProvider("github");
              setSelectedRepo(null);
              setAnalysis(null);
            }}
          >
            <FiGithub size={16} /> GitHub
          </button>
          <button
            className={provider === "gitlab" ? "active" : ""}
            onClick={() => {
              setProvider("gitlab");
              setSelectedRepo(null);
              setAnalysis(null);
            }}
          >
            <FiGitlab size={16} /> GitLab
          </button>
        </div>

        {!isConnected ? (
          <div className="import-not-connected">
            <p>Tu n'as pas encore connecté ton compte {provider === "github" ? "GitHub" : "GitLab"}.</p>
            <button className="btn btn-accent" onClick={handleConnect}>
              {provider === "github" ? <FiGithub size={16} /> : <FiGitlab size={16} />}
              Connecter {provider === "github" ? "GitHub" : "GitLab"}
            </button>
          </div>
        ) : (
          <>
            <div className="connection-status">
              <FiCheckCircle size={16} />
              Connecté en tant que <b>@{account}</b>
            </div>

            <div className="search-field">
              <FiSearch size={15} />
              <input
                type="text"
                placeholder="Rechercher un dépôt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="repo-list">
              {loadingRepos && <p>Chargement des dépôts...</p>}
              {!loadingRepos && filteredRepos.map((repo) => (
                <div key={repo.id} className="repo-row">
                  <div className="repo-info">
                    {repo.private ? <FiLock size={15} /> : <FiUnlock size={15} />}
                    <div>
                      <p className="repo-name">{repo.name}</p>
                      <p className="repo-updated">
                        Mis à jour {new Date(repo.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    className={repo.imported ? "btn btn-muted" : "btn btn-accent-sm"}
                    disabled={repo.imported}
                    onClick={() => handleImport(repo)}
                  >
                    {repo.imported ? "Déjà importé" : "Importer"}
                  </button>
                </div>
              ))}
              {!loadingRepos && filteredRepos.length === 0 && (
                <p className="repo-empty">Aucun dépôt ne correspond à ta recherche.</p>
              )}
            </div>

            {selectedRepo && (
              <div className="analysis-card">
                <div className="analysis-header">
                  <FiCpu size={17} />
                  <span>Analyse automatique — {selectedRepo.name}</span>
                </div>

                {analyzing ? (
                  <p className="analysis-loading">Analyse du dépôt en cours...</p>
                ) : (
                  analysis && (
                    <>
                      <div className="analysis-grid">
                        <div>
                          <span>Langage</span>
                          <p>{analysis.language || "Non détecté"}</p>
                        </div>
                        <div>
                          <span>Framework</span>
                          <p>{analysis.framework || "—"}</p>
                        </div>
                        <div>
                          <span>Dépendances</span>
                          <p>{analysis.dependencies_summary || "—"}</p>
                        </div>
                      </div>
                      <button
                        className="btn btn-accent btn-block"
                        onClick={handleConfirmDeploy}
                        disabled={deploying}
                      >
                        {deploying ? "Import en cours..." : "Confirmer et déployer"}
                      </button>
                    </>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ImportRepository;