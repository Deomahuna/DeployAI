import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FiBox, FiEye, FiEyeOff } from "react-icons/fi";
import { resetPassword } from "../../services/authService.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./ResetPassword.css";

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ["", "Faible", "Moyen", "Bon", "Robuste"];
const strengthColors = ["", "var(--error)", "var(--accent)", "var(--success)", "var(--success)"];

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword(email, code, newPassword);
      toast.success("Mot de passe réinitialisé. Connecte-toi.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!email) {
    return (
      <div className="reset-password">
        <p>Session invalide.</p>
        <Link to="/forgot-password">Recommencer</Link>
      </div>
    );
  }

  return (
    <div className="reset-password">
      <Link to="/" className="reset-password-logo">
        <FiBox size={22} />
        <span>DeployAI</span>
      </Link>

      <div className="reset-password-card">
        <p className="reset-password-title">Nouveau mot de passe</p>
        <p className="reset-password-subtitle">
          Code envoyé à <b>{email}</b>
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="code">Code de vérification</label>
          <input
            id="code"
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />

          <label htmlFor="newPassword">Nouveau mot de passe</label>
          <div className="password-field">
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          {newPassword.length > 0 && (
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

          <button type="submit" className="btn btn-accent btn-block" disabled={submitting || code.length !== 6}>
            {submitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;