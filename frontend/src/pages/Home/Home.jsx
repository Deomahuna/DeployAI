import { Link } from "react-router-dom";
import {
  FiBox,
  FiCpu,
  FiGithub,
  FiArrowRight,
  FiStar,
} from "react-icons/fi";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle.jsx";
import "./Home.css";

const features = [
  {
    icon: <FiGithub size={22} />,
    accent: "accent",
    title: "Import automatique",
    desc: "Connectez GitHub ou GitLab via OAuth, sans configuration manuelle.",
  },
  {
    icon: <FiBox size={22} />,
    accent: "accent",
    title: "Déploiement Docker",
    desc: "Détection du langage, du framework et des dépendances, puis build automatique.",
  },
  {
    icon: <FiCpu size={22} />,
    accent: "accent-ai",
    title: "Diagnostic intelligent",
    desc: "En cas d'échec, l'IA explique la cause et propose une correction, avec un score de confiance.",
  },
];

const terminalLines = [
  { text: "✓ Dépôt importé : yeboushop-api", tone: "success" },
  { text: "→ Construction de l'image Docker...", tone: "accent" },
  { text: "✓ Diagnostic IA : aucune erreur détectée", tone: "ai" },
  { text: "✓ Déployé sur https://yeboushop-api.deployai.app", tone: "success" },
];

function Home() {
  return (
    <div className="home">
      <header className="home-nav">
        <div className="home-logo">
          <FiBox size={22} />
          <span>DeployAI</span>
        </div>
        <nav className="home-links">
          <a href="#features">Fonctionnalités</a>
          <a href="#how">Comment ça marche</a>
          <Link to="/login">Connexion</Link>
          <Link to="/register" className="btn btn-accent">S'inscrire</Link>
          <ThemeToggle />
        </nav>
      </header>

      <section className="home-hero">
        <span className="home-badge">
          <FiStar size={14} />
          Diagnostic propulsé par l'IA
        </span>
        <h1>Déployez vos applications.<br />Laissez l'IA gérer les erreurs.</h1>
        <p>
          Connectez votre dépôt GitHub ou GitLab, et DeployAI construit, déploie et
          surveille votre application — avec un diagnostic intelligent en cas d'échec.
        </p>
        <div className="home-cta">
          <Link to="/register" className="btn btn-accent btn-lg">
            Commencer gratuitement
            <FiArrowRight size={16} />
          </Link>
          <a href="#how" className="btn btn-outline btn-lg">Voir la démo</a>
        </div>
      </section>

      <section className="home-terminal-wrap">
        <div className="home-terminal">
          {terminalLines.map((line, i) => (
            <div key={i} className={`term-line term-${line.tone}`}>{line.text}</div>
          ))}
        </div>
      </section>

      <section id="features" className="home-features">
        {features.map((f) => (
          <div key={f.title} className={`feature-card feature-${f.accent}`}>
            <div className="feature-icon">{f.icon}</div>
            <p className="feature-title">{f.title}</p>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="home-footer">
        © 2026 DeployAI · Projet de mémoire IFRI/UAC
      </footer>
    </div>
  );
}

export default Home;