import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveToken } from "../../services/authService.js";
import { useToast } from "../../context/ToastContext.jsx";

function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");

    if (!token) {
      toast.error("Connexion échouée. Réessaie.");
      navigate("/login");
      return;
    }

    saveToken(token);

    const providerLabel = provider === "github" ? "GitHub" : "GitLab";
    if (status === "created") {
      toast.success(`Compte créé avec ${providerLabel}. Tu peux configurer ton profil dans Paramètres.`);
    } else {
      toast.success(`Connecté avec ${providerLabel}.`);
    }

    navigate("/dashboard");
  }, [searchParams, navigate, toast]);

  return <p style={{ textAlign: "center", marginTop: "40px" }}>Connexion en cours...</p>;
}

export default AuthCallback;