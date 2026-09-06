import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiBox,
  FiLayout,
  FiFolder,
  FiGitBranch,
  FiServer,
  FiCpu,
} from "react-icons/fi";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle.jsx";
import { getProfile } from "../../services/userService.js";
import "./MainLayout.css";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: FiLayout },
  { to: "/projects", label: "Projets", icon: FiFolder },
  { to: "/import", label: "Importer un dépôt", icon: FiGitBranch },
  { to: "/deployments", label: "Déploiements", icon: FiServer },
  { to: "/diagnostics", label: "Diagnostics IA", icon: FiCpu, ai: true },
];

function MainLayout() {
  const [user, setUser] = useState({ name: "...", plan: "Plan gratuit", initials: "?" });

  useEffect(() => {
    getProfile()
      .then((profile) => {
        const initials = profile.full_name
          .split(" ")
          .filter(Boolean)
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        setUser({ name: profile.full_name, plan: "Plan gratuit", initials });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <FiBox size={20} />
          <span>DeployAI</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon, ai }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                "sidebar-link" + (isActive ? " active" : "") + (ai ? " ai" : "")
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/settings" className="sidebar-user-link">
            <div className="sidebar-avatar">{user.initials}</div>
            <div className="sidebar-user">
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-plan">{user.plan}</p>
            </div>
          </NavLink>
          <ThemeToggle />
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;