import { Link, useNavigate } from "react-router-dom";
import { FiBox, FiArrowLeft, FiHome } from "react-icons/fi";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle.jsx";
import "./NotFound.css";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound">
      <header className="notfound-top">
        <Link to="/" className="notfound-logo">
          <FiBox size={20} />
          <span>DeployAI</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="notfound-main">
        <p className="notfound-code">404</p>
        <h1>Cette page n'existe pas</h1>
        <p className="notfound-text">
          L'adresse est peut-être incorrecte, ou la page a été déplacée.
          Vérifiez l'URL ou revenez à un endroit connu.
        </p>

        <div className="notfound-actions">
          <button className="btn btn-outline" onClick={() => navigate(-1)}>
            <FiArrowLeft size={16} />
            Page précédente
          </button>
          <Link to="/" className="btn btn-accent">
            <FiHome size={16} />
            Accueil
          </Link>
        </div>

        <p className="notfound-links">
          Ou allez directement à : <Link to="/dashboard">Tableau de bord</Link>
          {" · "}
          <Link to="/projects">Projets</Link>
          {" · "}
          <Link to="/deployments">Déploiements</Link>
        </p>
      </main>
    </div>
  );
}

export default NotFound;