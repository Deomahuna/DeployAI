import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCpu, FiCheck } from "react-icons/fi";
import {
  getBuildConfig,
  updateBuildConfig,
} from "../../services/buildConfigService.js";
import { deployProject } from "../../services/projectService.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./BuildConfig.css";

const LANGUAGES = [
  {
    id: "node",
    label: "Node.js",
    defaultVersion: "20",
    defaultInstall: "npm install",
    defaultPort: 3000,
  },
  {
    id: "python",
    label: "Python",
    defaultVersion: "3.11",
    defaultInstall: "pip install -r requirements.txt",
    defaultPort: 8000,
  },
  {
    id: "php",
    label: "PHP",
    defaultVersion: "8.3",
    defaultInstall: "composer install --no-interaction --prefer-dist",
    defaultPort: 8000,
  },
  {
    id: "static",
    label: "Site statique (HTML/CSS/JS)",
    defaultVersion: "",
    defaultInstall: "",
    defaultPort: 80,
  },
];

function BuildConfig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState(null);

  // Deux modes : "generate" (langage + commandes -> Dockerfile généré),
  // "custom" (l'utilisateur a déjà son propre Dockerfile dans le dépôt, on
  // se contente d'en pointer le chemin, rien n'est généré).
  const [mode, setMode] = useState("generate");
  const [dockerfilePath, setDockerfilePath] = useState("");

  const [language, setLanguage] = useState("node");
  const [version, setVersion] = useState("20");
  const [installCmd, setInstallCmd] = useState("npm install");
  const [startCmd, setStartCmd] = useState("");
  const [port, setPort] = useState(3000);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    getBuildConfig(id)
      .then((config) => {
        setStrategy(config.strategy);
        if (config.dockerfile_path) {
          setMode("custom");
          setDockerfilePath(config.dockerfile_path);
        }
        if (config.language) setLanguage(config.language);
        if (config.version) setVersion(config.version);
        if (config.install_cmd) setInstallCmd(config.install_cmd);
        if (config.start_cmd) setStartCmd(config.start_cmd);
        if (config.port) setPort(config.port);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLanguageChange = (langId) => {
    setLanguage(langId);
    const lang = LANGUAGES.find((l) => l.id === langId);
    setVersion(lang.defaultVersion);
    setInstallCmd(lang.defaultInstall);
    setPort(lang.defaultPort);
  };

  const handleSaveAndDeploy = async () => {
    if (mode === "custom") {
      if (!dockerfilePath.trim()) {
        toast.error(
          "Indique le chemin de ton Dockerfile (ex: Dockerfile, backend/Dockerfile).",
        );
        return;
      }
    } else if (language !== "static" && !startCmd.trim()) {
      toast.error("Indique la commande de démarrage.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "custom") {
        await updateBuildConfig(id, { dockerfile_path: dockerfilePath.trim() });
      } else {
        await updateBuildConfig(id, {
          language,
          version,
          install_cmd: installCmd,
          start_cmd: startCmd,
          port: Number(port),
          // Explicitement à null : si le projet avait précédemment un
          // dockerfile_path personnalisé enregistré, on revient bien au
          // mode génération automatique au lieu de le laisser traîner.
          dockerfile_path: null,
        });
      }
      setSaving(false);
      setDeploying(true);
      await deployProject(id);
      toast.success("Configuration enregistrée, déploiement lancé.");
      navigate(`/projects/${id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      setDeploying(false);
    }
  };

  if (loading)
    return (
      <div className="build-config">
        <p>Chargement...</p>
      </div>
    );

  const isUndetected = strategy === "undetected";

  return (
    <div className="build-config">
      <header className="build-config-header">
        <FiCpu size={20} />
        <div>
          <p className="build-config-title">Configuration du déploiement</p>
          <p className="build-config-subtitle">
            {isUndetected
              ? "Le type de projet n'a pas pu être détecté automatiquement - configure-le manuellement ci-dessous."
              : "Vérifie ou ajuste la configuration détectée avant de déployer."}
          </p>
        </div>
      </header>

      <div className="build-config-body">
        <p className="build-config-section-label">Mode de configuration</p>
        <div className="mode-toggle">
          <button
            className={mode === "generate" ? "mode-btn active" : "mode-btn"}
            onClick={() => setMode("generate")}
          >
            Générer à partir d'un langage
          </button>
          <button
            className={mode === "custom" ? "mode-btn active" : "mode-btn"}
            onClick={() => setMode("custom")}
          >
            J'ai déjà mon propre Dockerfile
          </button>
        </div>

        {mode === "custom" ? (
          <>
            <p className="build-config-section-label">
              Chemin du Dockerfile dans le dépôt
            </p>
            <input
              type="text"
              value={dockerfilePath}
              onChange={(e) => setDockerfilePath(e.target.value)}
              placeholder="Dockerfile, backend/Dockerfile, docker/Dockerfile.prod..."
            />
            <p className="build-config-hint">
              Chemin relatif depuis la racine du dépôt (ou du sous-dossier
              configuré pour ce projet). Le fichier doit déjà exister dans ton
              dépôt - rien n'est généré dans ce mode.
            </p>
          </>
        ) : (
          <>
            <p className="build-config-section-label">1. Langage / runtime</p>
            <div className="language-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  className={
                    language === lang.id
                      ? "language-card active"
                      : "language-card"
                  }
                  onClick={() => handleLanguageChange(lang.id)}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {language !== "static" && (
              <>
                <p className="build-config-section-label">2. Version</p>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder={language === "node" ? "20" : "3.11"}
                />

                <p className="build-config-section-label">
                  3. Commande d'installation des dépendances
                </p>
                <input
                  type="text"
                  value={installCmd}
                  onChange={(e) => setInstallCmd(e.target.value)}
                />

                <p className="build-config-section-label">
                  4. Commande de démarrage
                </p>
                <input
                  type="text"
                  value={startCmd}
                  onChange={(e) => setStartCmd(e.target.value)}
                  placeholder={
                    language === "node" ? "npm start" : "python app.py"
                  }
                />

                <p className="build-config-section-label">
                  5. Port d'écoute de l'application
                </p>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
              </>
            )}
          </>
        )}

        <button
          className="btn btn-accent btn-block"
          onClick={handleSaveAndDeploy}
          disabled={saving || deploying}
        >
          <FiCheck size={15} />
          {saving
            ? "Enregistrement..."
            : deploying
              ? "Déploiement en cours..."
              : "Confirmer et déployer"}
        </button>
      </div>
    </div>
  );
}

export default BuildConfig;
