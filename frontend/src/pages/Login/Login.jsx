// =====================================================
// Page de connexion (UI — logique à brancher plus tard)
// =====================================================

import { Link } from "react-router-dom";
import "./Login.css";

function Login() {

    function handleSubmit(event) {
        event.preventDefault();
        // TODO : appeler authService.login() une fois le service créé
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Connexion</h1>

                <label>
                    Email
                    <input type="email" placeholder="vous@exemple.com" required />
                </label>

                <label>
                    Mot de passe
                    <input type="password" placeholder="••••••••" required />
                </label>

                <button type="submit" className="auth-submit">
                    Se connecter
                </button>

                <p className="auth-switch">
                    Pas encore de compte ? <Link to="/register">Créer un compte</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;