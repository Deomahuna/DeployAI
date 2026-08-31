// =====================================================
// Page d'accueil publique — avant connexion/inscription
// =====================================================

import { Link } from "react-router-dom";
import { FiZap, FiCpu, FiShield, FiArrowRight } from "react-icons/fi";

import ThemeToggle from "../../components/ThemeToggle/ThemeToggle.jsx";
import "./Home.css";

const features = [
    {
        icon: <FiCpu />,
        title: "Diagnostic intelligent",
        description:
            "Quand un déploiement échoue, DeployAI analyse les logs et explique la cause en langage clair, avec une solution suggérée — plus besoin de fouiller des lignes d'erreur brutes."
    },
    {
        icon: <FiZap />,
        title: "Déploiement automatisé",
        description:
            "Connecte ton dépôt GitHub, DeployAI construit l'image Docker et déploie ton application automatiquement, sans configuration manuelle complexe."
    },
    {
        icon: <FiShield />,
        title: "Suivi et fiabilité",
        description:
            "Historique complet de tes déploiements, statut en temps réel, et visibilité claire sur ce qui a réussi ou échoué, projet par projet."
    }
];

function Home() {
    return (
        <div className="home">

            <header className="home-header">
                <div className="home-brand">
                    🚀 <span>DeployAI</span>
                </div>

                <div className="home-header-actions">
                    <ThemeToggle />
                    <Link to="/login" className="home-btn home-btn-ghost">
                        Connexion
                    </Link>
                    <Link to="/register" className="home-btn home-btn-primary">
                        Créer un compte
                    </Link>
                </div>
            </header>

            <section className="home-hero">
                <h1>
                    Déployez vos applications,
                    <br />
                    laissez l'IA gérer les erreurs
                </h1>
                <p className="home-hero-subtitle">
                    {/* À REMPLACER : phrase d'accroche définitive du mémoire */}
                    DeployAI est une plateforme de déploiement qui diagnostique
                    automatiquement vos échecs de build grâce à l'intelligence
                    artificielle, pour que vous perdiez moins de temps à
                    comprendre pourquoi ça ne marche pas.
                </p>
                <Link to="/register" className="home-btn home-btn-primary home-btn-lg">
                    Commencer gratuitement <FiArrowRight />
                </Link>
            </section>

            <section className="home-features">
                <h2>Pourquoi DeployAI</h2>

                <div className="home-features-grid">
                    {features.map((feature) => (
                        <div className="home-feature-card" key={feature.title}>
                            <div className="home-feature-icon">
                                {feature.icon}
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="home-footer">
                {/* À REMPLACER : vraies infos (nom, mémoire, année) */}
                <p>DeployAI — Projet de mémoire, {new Date().getFullYear()}</p>
            </footer>

        </div>
    );
}

export default Home;