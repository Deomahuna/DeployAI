import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";

import MainLayout from "./layouts/MainLayout/MainLayout.jsx";

import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Projects from "./pages/Projects/Projects.jsx";
import ImportRepository from "./pages/ImportRepository/ImportRepository.jsx";
import Deployments from "./pages/Deployments/Deployments.jsx";
import Diagnostics from "./pages/Diagnostics/Diagnostics.jsx";

function App() {
    return (
        <Routes>

            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/import" element={<ImportRepository />} />
                <Route path="/deployments" element={<Deployments />} />
                <Route path="/diagnostics" element={<Diagnostics />} />
            </Route>

        </Routes>
    );
}

export default App;