import { useState } from "react";
import { Link } from "react-router-dom";
import { FiBox, FiKey, FiArrowLeft, FiMail } from "react-icons/fi";
import { forgotPassword } from "../../services/authService.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./ForgotPassword.css";

function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="forgot">
      <Link to="/" className="forgot-logo">
        <FiBox size={22} />
        <span>DeployAI</span>
      </Link>

      <div className="forgot-card">
        {sent ? (
          <>
            <div className="forgot-icon icon-success">
              <FiMail size={18} />
            </div>
            <p className="forgot-title">E-mail envoyé</p>
            <p className="forgot-subtitle">
              Si un compte existe pour <b>{email}</b>, un code de réinitialisation vient
              d'être envoyé. Vérifie aussi tes spams.
            </p>
            <Link
              to="/reset-password"
              state={{ email }}
              className="btn btn-accent btn-block"
            >
              J'ai reçu le code
            </Link>
            <Link to="/login" className="forgot-back" style={{ marginTop: "12px" }}>
              <FiArrowLeft size={13} /> Retour à la connexion
            </Link>
          </>
        ) : (
          <>
            <div className="forgot-icon">
              <FiKey size={18} />
            </div>
            <p className="forgot-title">Mot de passe oublié</p>
            <p className="forgot-subtitle">
              Indique ton adresse e-mail, on t'envoie un code de réinitialisation.
            </p>

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

              <button type="submit" className="btn btn-accent btn-block" disabled={sending}>
                {sending ? "Envoi en cours..." : "Envoyer le code"}
              </button>
            </form>

            <Link to="/login" className="forgot-back">
              <FiArrowLeft size={13} /> Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;