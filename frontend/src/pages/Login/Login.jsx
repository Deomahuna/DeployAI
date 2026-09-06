import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBox, FiEye, FiEyeOff, FiGithub, FiGitlab } from "react-icons/fi";
import { login, saveToken, startGithubLogin, startGitlabLogin } from "../../services/authService.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      saveToken(data.access_token);
      toast.success("Connexion réussie.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="login">
      <Link to="/" className="login-logo">
        <FiBox size={22} />
        <span>DeployAI</span>
      </Link>

      <div className="login-card">
        <p className="login-title">Connexion</p>
        <p className="login-subtitle">Accédez à vos projets et déploiements</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Adresse e-mail</label>
          <input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Mot de passe</label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          <div className="login-forgot">
            <Link to="/forgot-password">Mot de passe oublié ?</Link>
          </div>

          <button type="submit" className="btn btn-accent btn-block">
            Se connecter
          </button>
        </form>

        <div className="login-divider">
          <span></span>
          <p>ou</p>
          <span></span>
        </div>

        <button type="button" className="btn btn-outline btn-block" onClick={startGithubLogin}>
          <FiGithub size={17} />
          Continuer avec GitHub
        </button>

        <button type="button" className="btn btn-outline btn-block" onClick={startGitlabLogin}>
          <FiGitlab size={17} />
          Continuer avec GitLab
        </button>

        <p className="login-register">
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;