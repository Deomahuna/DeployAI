// =====================================================
// Layout principal — sidebar + zone de contenu
// =====================================================

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import "./MainLayout.css";

function MainLayout() {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="main-layout">

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="main-layout-body">

                <header className="main-layout-mobile-bar">
                    <button
                        className="main-layout-menu-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Ouvrir le menu"
                    >
                        <FiMenu />
                    </button>
                    <span className="main-layout-mobile-brand">
                        🚀 DeployAI
                    </span>
                </header>

                <main className="main-layout-content">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}

export default MainLayout;