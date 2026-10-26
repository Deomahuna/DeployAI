import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBox,
  FiGithub,
  FiGitlab,
  FiSearch,
  FiPackage,
  FiCpu,
  FiTerminal,
  FiSliders,
  FiKey,
  FiGlobe,
  FiShield,
  FiCheck,
  FiX,
  FiArrowRight,
} from "react-icons/fi";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle.jsx";
import "./Home.css";

/* ------------------------------------------------------------------
   Images détectées automatiquement (aucune erreur si le dossier est vide)
   - src/assets/home/hero/*            → diaporama du hero
   - src/assets/home/screens/*         → captures d'écran de l'application
------------------------------------------------------------------- */
const heroFound = import.meta.glob("../../assets/home/hero/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});
const heroImages = Object.keys(heroFound).sort().map((k) => heroFound[k]);

const shotsFound = import.meta.glob("../../assets/home/screens/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});
const shots = Object.keys(shotsFound)
  .sort()
  .map((path) => ({
    src: shotsFound[path],
    // "1-dashboard.png" -> "Dashboard"
    label: path
      .split("/")
      .pop()
      .replace(/\.\w+$/, "")
      .replace(/^\d+-/, "")
      .replace(/-/g, " ")
      .replace(/^./, (c) => c.toUpperCase()),
  }));

/* ------------------------------------------------------------------
   Données de la page
------------------------------------------------------------------- */
const pipeline = [
  { label: "Clonage du dépôt", detail: "main · 3 s", status: "ok" },
  { label: "Analyse du projet", detail: "Node.js 20 · Express", status: "ok" },
  { label: "Génération du Dockerfile", detail: "node.dockerfile", status: "ok" },
  { label: "Build de l'image Docker", detail: "échec · étape 6/9", status: "ko" },
];

const steps = [
  {
    icon: <FiGithub size={18} />,
    title: "Connecter le dépôt",
    desc: "Vous vous connectez avec GitHub ou GitLab, puis vous choisissez le dépôt, la branche et le sous-dossier à déployer.",
  },
  {
    icon: <FiSearch size={18} />,
    title: "Analyse du code",
    desc: "La plateforme repère le langage, le framework et les dépendances, puis choisit le modèle de Dockerfile adapté.",
  },
  {
    icon: <FiPackage size={18} />,
    title: "Build et déploiement",
    desc: "L'image est construite et le conteneur lancé. Les logs s'affichent pendant l'opération.",
  },
  {
    icon: <FiCpu size={18} />,
    title: "Diagnostic en cas d'échec",
    desc: "Si le déploiement échoue, un rapport indique la cause probable, la gravité, une solution et un niveau de confiance.",
  },
];

const features = [
  {
    icon: <FiTerminal size={18} />,
    title: "Logs en temps réel",
    desc: "Le déroulement du build est diffusé en direct dans l'interface, sans recharger la page.",
  },
  {
    icon: <FiSliders size={18} />,
    title: "Configuration du build",
    desc: "Commande d'installation, commande de build et dossier de sortie modifiables pour chaque projet.",
  },
  {
    icon: <FiKey size={18} />,
    title: "Variables d'environnement",
    desc: "Les secrets sont enregistrés par projet et injectés au moment du déploiement.",
  },
  {
    icon: <FiGlobe size={18} />,
    title: "URL de prévisualisation",
    desc: "Chaque déploiement réussi reçoit une adresse pour tester l'application en ligne.",
  },
  {
    icon: <FiBox size={18} />,
    title: "Historique des déploiements",
    desc: "Statut, durée et journal de chaque tentative sont conservés et consultables par projet.",
  },
  {
    icon: <FiShield size={18} />,
    title: "Compte sécurisé",
    desc: "Inscription avec vérification par code envoyé par e-mail, et réinitialisation du mot de passe.",
  },
];

const stacks = ["Node.js", "React / Vite", "Python", "PHP", "Site statique"];

const report = [
  {
    label: "Cause",
    value: "Le module « sharp » est absent de package.json alors qu'il est importé dans src/upload.js.",
  },
  { label: "Gravité", value: "Moyenne" },
  {
    label: "Solution",
    value: "Exécuter npm install sharp, valider package.json puis relancer le déploiement.",
  },
];

/* ------------------------------------------------------------------
   Diaporama d'images en fond du hero
------------------------------------------------------------------- */
function HeroSlides() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (heroImages.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % heroImages.length), 6000);
    return () => clearInterval(id);
  }, []);

  if (heroImages.length === 0) return null;

  return (
    <>
      <div className="hero-slides" aria-hidden="true">
        {heroImages.map((src, i) => (
          <div
            key={src}
            className={i === index ? "hero-slide active" : "hero-slide"}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>
      {heroImages.length > 1 && (
        <div className="hero-dots">
          {heroImages.map((src, i) => (
            <button
              key={src}
              type="button"
              className={i === index ? "hero-dot active" : "hero-dot"}
              onClick={() => setIndex(i)}
              aria-label={`Afficher l'image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------
   Aperçu de l'application : captures d'écran avec onglets
------------------------------------------------------------------- */
function ProductTour() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || shots.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % shots.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  if (shots.length === 0) return null;

  return (
    <section
      className="home-container section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="section-head">
        <h2>Aperçu de la plateforme</h2>
        <p>Les écrans principaux de l'application, tels qu'ils apparaissent à l'utilisateur.</p>
      </div>

      <div className="tour-tabs">
        {shots.map((s, i) => (
          <button
            key={s.src}
            type="button"
            className={i === active ? "tour-tab active" : "tour-tab"}
            onClick={() => setActive(i)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="tour-frame">
        <div className="tour-bar">
          <span />
          <span />
          <span />
        </div>
        <img src={shots[active].src} alt={`Capture d'écran : ${shots[active].label}`} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   Page d'accueil
------------------------------------------------------------------- */
function Home() {
  return (
    <div className="home">
      <header className="home-nav">
        <div className="home-container home-nav-inner">
          <a href="#top" className="home-logo">
            <FiBox size={20} />
            <span>DeployAI</span>
          </a>
          <nav className="home-links">
            <a href="#how">Fonctionnement</a>
            <a href="#features">Fonctionnalités</a>
            <a href="#diagnostic">Diagnostic</a>
            <Link to="/login">Connexion</Link>
            <Link to="/register" className="btn btn-accent">Créer un compte</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ---------- Hero ---------- */}
        <div className={heroImages.length ? "hero-wrap has-bg" : "hero-wrap"}>
          <HeroSlides />

          <section className="home-container home-hero">
            <div className="hero-text">
              <p className="hero-kicker">Plateforme de déploiement</p>
              <h1>Du dépôt Git à l'application en ligne, et une explication quand ça échoue.</h1>
              <p className="hero-sub">
                DeployAI importe votre projet depuis GitHub ou GitLab, construit son image Docker
                et le met en ligne. Si le déploiement plante, il lit les logs et vous dit pourquoi.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="btn btn-accent btn-lg">
                  Importer un dépôt
                  <FiArrowRight size={16} />
                </Link>
                <a href="#how" className="btn btn-outline btn-lg">Voir le fonctionnement</a>
              </div>
              <div className="hero-providers">
                <span>Connexion avec</span>
                <FiGithub size={16} /> GitHub
                <FiGitlab size={16} /> GitLab
              </div>
            </div>

            <div className="deploy-card" aria-label="Exemple de déploiement">
              <div className="deploy-card-head">
                <div>
                  <p className="deploy-name">yeboushop-api</p>
                  <p className="deploy-meta">Déploiement n° 12 · exemple</p>
                </div>
                <span className="pill pill-ko">Échec</span>
              </div>
              <ul className="deploy-steps">
                {pipeline.map((s) => (
                  <li key={s.label} className={`deploy-step step-${s.status}`}>
                    <span className="step-icon">
                      {s.status === "ok" ? <FiCheck size={13} /> : <FiX size={13} />}
                    </span>
                    <span className="step-label">{s.label}</span>
                    <span className="step-detail">{s.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="deploy-ai">
                <FiCpu size={15} />
                <span>Diagnostic disponible : dépendance manquante (confiance 92 %)</span>
              </div>
            </div>
          </section>
        </div>

        {/* ---------- Technologies ---------- */}
        <div className="stack-band">
          <div className="home-container stack-strip">
            <p>Projets reconnus automatiquement</p>
            <ul>
              {stacks.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---------- Aperçu (captures d'écran, si présentes) ---------- */}
        <ProductTour />

        {/* ---------- Fonctionnement ---------- */}
        <section id="how" className="home-container section">
          <div className="section-head">
            <h2>Comment ça marche</h2>
            <p>Quatre étapes, de l'import du dépôt jusqu'au rapport d'erreur.</p>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num">0{i + 1}</span>
                <div className="step-ico">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Fonctionnalités ---------- */}
        <section id="features" className="home-container section">
          <div className="section-head">
            <h2>Ce que contient la plateforme</h2>
            <p>Les outils nécessaires pour suivre un projet du premier déploiement jusqu'aux suivants.</p>
          </div>
          <div className="feature-grid">
            {features.map((f) => (
              <article key={f.title} className="feature">
                <div className="feature-ico">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Diagnostic ---------- */}
        <section id="diagnostic" className="home-container section diag">
          <div className="diag-text">
            <h2>Un rapport lisible quand le build échoue</h2>
            <p>
              Au lieu de fouiller dans des centaines de lignes de logs, vous recevez une synthèse.
              Le module de diagnostic envoie le journal d'erreur à un modèle de langage, puis
              présente son analyse avec un niveau de confiance, pour que vous sachiez
              quand vérifier la suggestion à la main.
            </p>
            <Link to="/register" className="btn btn-outline">
              Essayer sur un projet
              <FiArrowRight size={15} />
            </Link>
          </div>

          <div className="report">
            <div className="report-head">
              <FiCpu size={15} />
              <span>Rapport de diagnostic</span>
              <span className="report-example">exemple</span>
            </div>
            <dl>
              {report.map((r) => (
                <div key={r.label} className="report-row">
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
              <div className="report-row">
                <dt>Confiance</dt>
                <dd>
                  <div className="confidence">
                    <div className="confidence-bar">
                      <span style={{ width: "92%" }} />
                    </div>
                    <strong>92 %</strong>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ---------- Appel final ---------- */}
        <section className="home-container">
          <div className="final-cta">
            <h2>Prêt à déployer votre premier projet ?</h2>
            <p>Créez un compte, connectez votre dépôt et lancez un déploiement.</p>
            <Link to="/register" className="btn btn-accent btn-lg">Créer un compte</Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container footer-inner">
          <div>
            <p className="footer-brand">
              <FiBox size={16} /> DeployAI
            </p>
            <p className="footer-note">
              Plateforme de déploiement automatique et de diagnostic des erreurs.
            </p>
          </div>
          <div className="footer-cols">
            <div>
              <p className="footer-title">Plateforme</p>
              <a href="#how">Fonctionnement</a>
              <a href="#features">Fonctionnalités</a>
              <a href="#diagnostic">Diagnostic</a>
            </div>
            <div>
              <p className="footer-title">Compte</p>
              <Link to="/login">Connexion</Link>
              <Link to="/register">Inscription</Link>
              <Link to="/forgot-password">Mot de passe oublié</Link>
            </div>
          </div>
        </div>
        <div className="home-container footer-bottom">
          © 2026 DeployAI · Projet de licence, IFRI-UAC
        </div>
      </footer>
    </div>
  );
}

export default Home;