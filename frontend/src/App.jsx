import {
    BrowserRouter,
    Routes,
    Route,
    Link
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ImportRepository from "./pages/ImportRepository";
import Deployments from "./pages/Deployments";
import Diagnostics from "./pages/Diagnostics";


function App() {
    return (
        <BrowserRouter>

            <div style={{ padding: "20px" }}>

                <h1>🚀 DeployAI</h1>

                <nav style={{ marginBottom: "30px" }}>

                    <Link to="/" style={{ marginRight: "20px" }}>
                        📊 Dashboard
                    </Link>

                    <Link to="/projects" style={{ marginRight: "20px" }}>
                        📁 Projets
                    </Link>

                    <Link to="/import" style={{ marginRight: "20px" }}>
                        📥 Importer
                    </Link>

                    <Link to="/deployments" style={{ marginRight: "20px" }}>
                        🚀 Déploiements
                    </Link>

                    <Link to="/diagnostics">
                        🤖 Diagnostics
                    </Link>

                </nav>


                <Routes>

                    <Route
                        path="/"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/projects"
                        element={<Projects />}
                    />

                    <Route
                        path="/import"
                        element={<ImportRepository />}
                    />

                    <Route
                        path="/deployments"
                        element={<Deployments />}
                    />

                    <Route
                        path="/diagnostics"
                        element={<Diagnostics />}
                    />

                </Routes>

            </div>

        </BrowserRouter>
    );
}


export default App;