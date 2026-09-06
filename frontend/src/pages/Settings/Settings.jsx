import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiLink, FiGithub, FiGitlab, FiLogOut, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { getProfile, updateProfile, updatePassword, uploadAvatar } from "../../services/userService.js";
import { getIntegrations, disconnectIntegration, connectGithub, connectGitlab } from "../../services/oauthService.js";
import { logout } from "../../services/authService.js";
import { API_URL } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./Settings.css";

const sections = [
  { id: "profile", label: "Profil", icon: FiUser },
  { id: "security", label: "Sécurité", icon: FiLock },
  { id: "integrations", label: "Intégrations", icon: FiLink },
];

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

function ProfileSection() {
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getProfile()
      .then((user) => {
        setFullName(user.full_name);
        setEmail(user.email);
        setEmailVerified(user.email_verified);
        setAvatarUrl(user.avatar_url ? `${API_URL}${user.avatar_url}` : null);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const user = await uploadAvatar(file);
      setAvatarUrl(`${API_URL}${user.avatar_url}`);
      toast.success("Photo de profil mise à jour.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile(fullName, email);
      setSaved(true);
      toast.success("Profil mis à jour.");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <>
      <p className="settings-title">Profil</p>
      <p className="settings-subtitle">Gère les informations de ton compte</p>

      <div className="avatar-row">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="avatar-img" />
        ) : (
          <div className="avatar-circle">{initials || "?"}</div>
        )}
        <div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? "Envoi..." : "Changer la photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div className={`email-status ${emailVerified ? "verified" : "unverified"}`}>
        {emailVerified ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
        {emailVerified ? "Email vérifié" : "Email non vérifié"}
      </div>

      <form onSubmit={handleSave}>
        <label htmlFor="fullName">Nom complet</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit" className="btn btn-accent" disabled={saving}>
          {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </form>
    </>
  );
}

function SecuritySection() {
  const toast = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (strength < 2) {
      setError("Choisis un mot de passe plus robuste.");
      return;
    }
    setUpdating(true);
    try {
      await updatePassword(newPassword);
      setUpdated(true);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Mot de passe mis à jour.");
      setTimeout(() => setUpdated(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <p className="settings-title">Changer le mot de passe</p>
      <p className="settings-subtitle">
        Utilise un mot de passe robuste que tu n'utilises nulle part ailleurs
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="newPassword">Nouveau mot de passe</label>
        <input
          id="newPassword"
          type="password"
          placeholder="••••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

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

        <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {mismatch && <p className="field-error">Les mots de passe ne correspondent pas.</p>}

        {error && <p className="field-error">{error}</p>}

        <button type="submit" className="btn btn-accent" disabled={updating}>
          {updating
            ? "Mise à jour..."
            : updated
            ? "Mot de passe mis à jour ✓"
            : "Mettre à jour le mot de passe"}
        </button>
      </form>
    </>
  );
}

function IntegrationsSection() {
  const toast = useToast();
  const [integrations, setIntegrations] = useState(null);

  useEffect(() => {
    getIntegrations()
      .then(setIntegrations)
      .catch((err) => toast.error(err.message));
  }, []);

  const handleDisconnect = async (provider) => {
    try {
      await disconnectIntegration(provider);
      setIntegrations((prev) => ({
        ...prev,
        [provider]: { connected: false, account: null },
      }));
      toast.success(`${provider === "github" ? "GitHub" : "GitLab"} déconnecté.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!integrations) return <p>Chargement...</p>;

  return (
    <>
      <p className="settings-title">Intégrations</p>
      <p className="settings-subtitle">Gère les comptes connectés pour l'import de dépôts</p>

      <div className="integration-row">
        <div className="integration-info">
          <FiGithub size={20} />
          <div>
            <p className="integration-name">GitHub</p>
            <p className="integration-status">
              {integrations.github.connected
                ? `Connecté en tant que ${integrations.github.account}`
                : "Non connecté"}
            </p>
          </div>
        </div>
        <button
          className={integrations.github.connected ? "btn btn-outline btn-sm" : "btn btn-accent btn-sm"}
          onClick={() => (integrations.github.connected ? handleDisconnect("github") : connectGithub())}
        >
          {integrations.github.connected ? "Déconnecter" : "Connecter"}
        </button>
      </div>

      <div className="integration-row">
        <div className="integration-info">
          <FiGitlab size={20} />
          <div>
            <p className="integration-name">GitLab</p>
            <p className="integration-status">
              {integrations.gitlab.connected
                ? `Connecté en tant que ${integrations.gitlab.account}`
                : "Non connecté"}
            </p>
          </div>
        </div>
        <button
          className={integrations.gitlab.connected ? "btn btn-outline btn-sm" : "btn btn-accent btn-sm"}
          onClick={() => (integrations.gitlab.connected ? handleDisconnect("gitlab") : connectGitlab())}
        >
          {integrations.gitlab.connected ? "Déconnecter" : "Connecter"}
        </button>
      </div>
    </>
  );
}

function Settings() {
  const navigate = useNavigate();
  const [active, setActive] = useState("profile");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="settings-page">
      <aside className="settings-nav">
        <p className="settings-nav-title">Paramètres</p>
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={active === id ? "settings-nav-link active" : "settings-nav-link"}
            onClick={() => setActive(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}

        <div className="settings-nav-divider" />

        <button className="settings-nav-link settings-logout" onClick={handleLogout}>
          <FiLogOut size={16} />
          Déconnexion
        </button>
      </aside>

      <div className="settings-content">
        {active === "profile" && <ProfileSection />}
        {active === "security" && <SecuritySection />}
        {active === "integrations" && <IntegrationsSection />}
      </div>
    </div>
  );
}

export default Settings;