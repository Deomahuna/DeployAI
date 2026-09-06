// =====================================================
// Bouton de bascule entre thème clair et sombre
// =====================================================

import { FiMoon, FiSun } from "react-icons/fi";
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
            {theme === "light" ? <FiMoon size={16} /> : <FiSun size={16} />}
        </button>
    );
}

export default ThemeToggle;