import { Link } from "react-router-dom";
import { FiBox } from "react-icons/fi";
import ThemeToggle from "../ThemeToggle/ThemeToggle.jsx";
import "./AuthHeader.css";

// page = "login" ou "register" : change le bouton d'action à droite
function AuthHeader({ page }) {
  return (
    <header className="auth-header">
      <Link to="/" className="auth-header-logo">
        <FiBox size={20} />
        <span>DeployAI</span>
      </Link>

      <nav className="auth-header-nav">
        <Link to="/" className="auth-header-home">Accueil</Link>

        {page === "login" ? (
          <Link to="/register" className="btn btn-accent">Créer un compte</Link>
        ) : (
          <Link to="/login" className="btn auth-header-ghost">Connexion</Link>
        )}

        <ThemeToggle />
      </nav>
    </header>
  );
}

export default AuthHeader;