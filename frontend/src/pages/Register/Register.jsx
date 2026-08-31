// =====================================================
// Page d'inscription (UI — logique à brancher plus tard)
// =====================================================

import { Link } from "react-router-dom";
import "./Register.css";

function Register() {

    function handleSubmit(event) {
        event.preventDefault();
        // TODO : appeler authService.register() une fois le service créé
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Créer un compte</h1>

                <label>
                    Nom
                    <input type="text" placeholder="Votre nom" required />
                </label>

                <label>
                    Email
                    <input type="email" placeholder="vous@exemple.com" required />
                </label>

                <label>
                    Mot de passe
                    <input type="password" placeholder="••••••••" required />
                </label>

                <button type="submit" className="auth-submit">
                    S'inscrire
                </button>

                <p className="auth-switch">
                    Déjà un compte ? <Link to="/login">Se connecter</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;