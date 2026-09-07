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
  FiLink,
  FiUpload,
} from "react-icons/fi";
import {
  getIntegrations,
  connectGithub,
  connectGitlab,
} from "../../services/oauthService.js";
import { listRepos, listBranches } from "../../services/importService.js";

import { useToast } from "../../context/ToastContext.jsx";
import "./ImportRepository.css";
import { analyzeRepo, importProject, importFromUrl, importFromArchive, deployProject } from "../../services/projectService.js";

function UrlImportForm({ onImported }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setImporting(true);
    try {
      const project = await importFromUrl(name, url);
      toast.success(`${project.name} importé.`);
      onImported(project);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <form className="url-import-form" onSubmit={handleSubmit}>
      <label>Nom du projet</label>
      <input
        type="text"
        placeholder="mon-projet"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <label>URL du dépôt Git public</label>
      <input
        type="url"
        placeholder="https://github.com/utilisateur/depot.git"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button
        type="submit"
        className="btn btn-accent btn-block"
        disabled={importing}
      >
        {importing ? "Import en cours..." : "Importer depuis cette URL"}
      </button>
    </form>
  );
}

function ArchiveImportForm({ onImported }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !file) return;
    setImporting(true);
    try {
      const project = await importFromArchive(name, file);
      toast.success(`${project.name} importé.`);
      onImported(project);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <form className="archive-import-form" onSubmit={handleSubmit}>
      <label>Nom du projet</label>
      <input
        type="text"
        placeholder="mon-projet"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <label>Archive du projet (.zip)</label>
      <input
        type="file"
        accept=".zip"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        required
      />
      <button
        type="submit"
        className="btn btn-accent btn-block"
        disabled={importing}
      >
        {importing ? "Import en cours..." : "Importer l'archive"}
      </button>
    </form>
  );
}

function ImportRepository() {
  const navigate = useNavigate();
  const toast = useToast();

  const [mode, setMode] = useState("github");
  const [integrations, setIntegrations] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [subdirectory, setSubdirectory] = useState("");

  const isGitProvider = mode === "github" || mode === "gitlab";

  useEffect(() => {
    getIntegrations()
      .then(setIntegrations)
      .catch((err) => toast.error(err.message));
  }, []);

  useEffect(() => {
    if (!isGitProvider || !integrations) return;
    const connected = integrations[mode]?.connected;
    if (!connected) {
      setRepos([]);
      return;
    }
    setLoadingRepos(true);
    listRepos(mode)
      .then(setRepos)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingRepos(false));
  }, [mode, integrations]);

  const isConnected = isGitProvider ? integrations?.[mode]?.connected : false;
  const account = isGitProvider ? integrations?.[mode]?.account : null;

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleConnect = () => {
    if (mode === "github") connectGithub();
    else connectGitlab();
  };

  const handleImport = async (repo) => {
    setSelectedRepo(repo);
    setAnalysis(null);
    setBranches([]);
    setSelectedBranch("main");
    setSubdirectory("");
    setAnalyzing(true);
    try {
      const [result, branchList] = await Promise.all([
        analyzeRepo(
          `https://${mode === "github" ? "github.com" : "gitlab.com"}/${repo.full_name}`,
        ),
        listBranches(mode, repo.full_name),
      ]);
      setAnalysis(result);
      setBranches(branchList);
      if (branchList.length > 0) setSelectedBranch(branchList[0]);
    } catch (err) {
      toast.error(err.message);
      setSelectedRepo(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBranchChange = async (newBranch) => {
    setSelectedBranch(newBranch);
    setAnalyzing(true);
    try {
      const result = await analyzeRepo(
        `https://${mode === "github" ? "github.com" : "gitlab.com"}/${selectedRepo.full_name}`,
        newBranch,
      );
      setAnalysis(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubdirChange = async (newSubdir) => {
  setAnalyzing(true);
  try {
    const result = await analyzeRepo(
      `https://${mode === "github" ? "github.com" : "gitlab.com"}/${selectedRepo.full_name}`,
      selectedBranch,
      newSubdir.trim() || null
    );
    setAnalysis(result);
  } catch (err) {
    toast.error(err.message);
  } finally {
    setAnalyzing(false);
  }
};

const handleConfirmDeploy = async () => {
  setDeploying(true);
  try {
    const project = await importProject({
      name: selectedRepo.name,
      repo_url: `https://${mode === "github" ? "github.com" : "gitlab.com"}/${selectedRepo.full_name}`,
      provider: mode,
      repo_id: selectedRepo.id,
      language: analysis.language,
      framework: analysis.framework,
      dependencies_summary: analysis.dependencies_summary,
      branch: selectedBranch,
      subdirectory: subdirectory.trim() || null,
    });
    toast.success(`${project.name} importé, déploiement en cours...`);
    await deployProject(project.id);
    navigate(`/projects/${project.id}`);
  } catch (err) {
    toast.error(err.message);
  } finally {
    setDeploying(false);
  }
};
  const handleDirectImportSuccess = (project) => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="import-page">
      <header className="import-header">
        <p className="import-title">Importer un dépôt</p>
        <p className="import-subtitle">
          Connecte un dépôt GitHub/GitLab, ou importe directement via une URL ou
          une archive
        </p>
      </header>

      <div className="import-body">
        <div className="provider-tabs">
          <button
            className={mode === "github" ? "active" : ""}
            onClick={() => setMode("github")}
          >
            <FiGithub size={16} /> GitHub
          </button>
          <button
            className={mode === "gitlab" ? "active" : ""}
            onClick={() => setMode("gitlab")}
          >
            <FiGitlab size={16} /> GitLab
          </button>
          <button
            className={mode === "url" ? "active" : ""}
            onClick={() => setMode("url")}
          >
            <FiLink size={16} /> URL directe
          </button>
          <button
            className={mode === "archive" ? "active" : ""}
            onClick={() => setMode("archive")}
          >
            <FiUpload size={16} /> Upload ZIP
          </button>
        </div>

        {mode === "url" && (
          <UrlImportForm onImported={handleDirectImportSuccess} />
        )}
        {mode === "archive" && (
          <ArchiveImportForm onImported={handleDirectImportSuccess} />
        )}

        {isGitProvider && !isConnected && (
          <div className="import-not-connected">
            <p>
              Tu n'as pas encore connecté ton compte{" "}
              {mode === "github" ? "GitHub" : "GitLab"}.
            </p>
            <button className="btn btn-accent" onClick={handleConnect}>
              {mode === "github" ? (
                <FiGithub size={16} />
              ) : (
                <FiGitlab size={16} />
              )}
              Connecter {mode === "github" ? "GitHub" : "GitLab"}
            </button>
          </div>
        )}

        {isGitProvider && isConnected && (
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
              {!loadingRepos &&
                filteredRepos.map((repo) => (
                  <div key={repo.id} className="repo-row">
                    <div className="repo-info">
                      {repo.private ? (
                        <FiLock size={15} />
                      ) : (
                        <FiUnlock size={15} />
                      )}
                      <div>
                        <p className="repo-name">{repo.name}</p>
                        <p className="repo-updated">
                          Mis à jour{" "}
                          {new Date(repo.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      className={
                        repo.imported ? "btn btn-muted" : "btn btn-accent-sm"
                      }
                      disabled={repo.imported}
                      onClick={() => handleImport(repo)}
                    >
                      {repo.imported ? "Déjà importé" : "Importer"}
                    </button>
                  </div>
                ))}
              {!loadingRepos && filteredRepos.length === 0 && (
                <p className="repo-empty">
                  Aucun dépôt ne correspond à ta recherche.
                </p>
              )}
            </div>

            {selectedRepo && (
              <div className="analysis-card">
                <div className="analysis-header">
                  <FiCpu size={17} />
                  <span>Analyse automatique — {selectedRepo.name}</span>
                </div>

                {analyzing ? (
                  <p className="analysis-loading">
                    Analyse du dépôt en cours...
                  </p>
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

                      <div className="branch-subdir-row">
                        <div>
                          <label>Branche</label>
                          <select
                            value={selectedBranch}
                            onChange={(e) => handleBranchChange(e.target.value)}
                          >
                            {branches.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label>Sous-dossier (optionnel)</label>
                          <input
                            type="text"
                            placeholder="ex: backend/ (vide = racine)"
                            value={subdirectory}
                            onChange={(e) => setSubdirectory(e.target.value)}
                            onBlur={() => handleSubdirChange(subdirectory)}
                          />
                        </div>
                      </div>

                      <button
                        className="btn btn-accent btn-block"
                        onClick={handleConfirmDeploy}
                        disabled={deploying}
                      >
                        {deploying
                          ? "Import en cours..."
                          : "Confirmer et déployer"}
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
