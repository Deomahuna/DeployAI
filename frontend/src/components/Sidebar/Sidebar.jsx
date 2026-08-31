// =====================================================
// Barre latérale de navigation (remplace la Navbar)
// =====================================================

import { NavLink } from "react-router-dom";
import {
    FiGrid,
    FiFolder,
    FiUploadCloud,
    FiSend,
    FiActivity,
    FiX
} from "react-icons/fi";

import ThemeToggle from "../ThemeToggle/ThemeToggle.jsx";
import "./Sidebar.css";

const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { to: "/projects", label: "Projets", icon: <FiFolder /> },
    { to: "/import", label: "Importer", icon: <FiUploadCloud /> },
    { to: "/deployments", label: "Déploiements", icon: <FiSend /> },
    { to: "/diagnostics", label: "Diagnostics", icon: <FiActivity /> }
];

function Sidebar({ isOpen, onClose }) {
    return (
        <>
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}

            <aside className={isOpen ? "sidebar sidebar-open" : "sidebar"}>

                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        🚀 <span>DeployAI</span>
                    </div>
                    <button
                        className="sidebar-close"
                        onClick={onClose}
                        aria-label="Fermer le menu"
                    >
                        <FiX />
                    </button>
                </div>

                <nav className="sidebar-links">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={({ isActive }) =>
                                isActive ? "sidebar-link active" : "sidebar-link"
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <ThemeToggle />
                </div>

            </aside>
        </>
    );
}

export default Sidebar;