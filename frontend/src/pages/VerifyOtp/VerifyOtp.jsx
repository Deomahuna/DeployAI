import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FiBox } from "react-icons/fi";
import { verifyOtp, resendOtp, saveToken } from "../../services/authService.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./VerifyOtp.css";

function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const email = location.state?.email || "";
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const data = await verifyOtp(email, code);
      saveToken(data.access_token);
      toast.success("Email vérifié avec succès.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email);
      toast.success("Nouveau code envoyé.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="verify-otp">
        <p>Session invalide. Recommence l'inscription.</p>
        <Link to="/register">Retour à l'inscription</Link>
      </div>
    );
  }

  return (
    <div className="verify-otp">
      <Link to="/" className="verify-otp-logo">
        <FiBox size={22} />
        <span>DeployAI</span>
      </Link>

      <div className="verify-otp-card">
        <p className="verify-otp-title">Vérifie ton email</p>
        <p className="verify-otp-subtitle">
          Un code à 6 chiffres a été envoyé à <b>{email}</b>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="otp-input"
            required
          />
          <button type="submit" className="btn btn-accent btn-block" disabled={verifying || code.length !== 6}>
            {verifying ? "Vérification..." : "Vérifier"}
          </button>
        </form>

        <button className="link-btn" onClick={handleResend} disabled={resending}>
          {resending ? "Envoi..." : "Renvoyer le code"}
        </button>
      </div>
    </div>
  );
}

export default VerifyOtp;