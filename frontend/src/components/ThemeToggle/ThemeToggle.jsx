// =====================================================
// Bouton de bascule entre thème clair et sombre
// =====================================================

import { useTheme } from "../../context/ThemeContext.jsx";
import "./ThemeToggle.css";

function ThemeToggle() {

    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Changer de thème"
            title={
                theme === "light"
                    ? "Passer en mode sombre"
                    : "Passer en mode clair"
            }
        >
            {theme === "light" ? "🌙" : "☀️"}
        </button>
    );
}

export default ThemeToggle;