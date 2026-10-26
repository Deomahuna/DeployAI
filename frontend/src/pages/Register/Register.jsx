import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiGithub, FiGitlab } from "react-icons/fi";
import { register, startGithubLogin, startGitlabLogin } from "../../services/authService.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./Register.css";
import AuthBackground from "../../components/AuthBackground/AuthBackground.jsx";
import AuthHeader from "../../components/AuthHeader/AuthHeader.jsx";

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0 à 4
}

const strengthLabels = ["", "Faible", "Moyen", "Bon", "Mot de passe robuste"];
const strengthColors = ["", "var(--error)", "var(--accent)", "var(--success)", "var(--success)"];

function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    try {
      await register(fullName, email, password);
      toast.success("Compte créé. Vérifie ton email pour le code de confirmation.");
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register">
      <AuthBackground />
      <AuthHeader page="register" />

      <div className="register-card">
        <p className="register-title">Créer un compte</p>
        <p className="register-subtitle">Déployez votre premier projet en quelques minutes</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="fullName">Nom complet</label>
          <input
            id="fullName"
            type="text"
            placeholder="Votre nom"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

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

          {password.length > 0 && (
            <>
              <div className="strength-bars">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="strength-bar"
                    style={{ background: i <= strength ? strengthColors[strength] : "var(--border)" }}
                  />
                ))}
              </div>
              <p className="strength-label" style={{ color: strengthColors[strength] }}>
                {strengthLabels[strength]}
              </p>
            </>
          )}

          <label className="register-terms">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              J'accepte les <Link to="/terms">conditions d'utilisation</Link> et la{" "}
              <Link to="/privacy">politique de confidentialité</Link>
            </span>
          </label>

          <button type="submit" className="btn btn-accent btn-block" disabled={!agreed || submitting}>
            {submitting ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <div className="register-divider">
          <span></span>
          <p>ou</p>
          <span></span>
        </div>

        <button type="button" className="btn btn-outline btn-block" onClick={startGithubLogin}>
          <FiGithub size={17} />
          S'inscrire avec GitHub
        </button>

        <button type="button" className="btn btn-outline btn-block" onClick={startGitlabLogin}>
          <FiGitlab size={17} />
          S'inscrire avec GitLab
        </button>

        <p className="register-login">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;