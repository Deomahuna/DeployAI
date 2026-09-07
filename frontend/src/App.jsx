import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword/ResetPassword.jsx";
import AuthCallback from "./pages/AuthCallback/AuthCallback.jsx";
import VerifyOtp from "./pages/VerifyOtp/VerifyOtp.jsx";

import MainLayout from "./layouts/MainLayout/MainLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx";

import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Projects from "./pages/Projects/Projects.jsx";
import ProjectDetail from "./pages/ProjectDetail/ProjectDetail.jsx";
import ImportRepository from "./pages/ImportRepository/ImportRepository.jsx";
import Deployments from "./pages/Deployments/Deployments.jsx";
import Diagnostics from "./pages/Diagnostics/Diagnostics.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import BuildConfig from "./pages/BuildConfig/BuildConfig.jsx";

function App() {
    return (
        <Routes>

            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/import" element={<ImportRepository />} />
                <Route path="/deployments" element={<Deployments />} />
                <Route path="/diagnostics" element={<Diagnostics />} />
                <Route path="/projects/:id/build-config" element={<BuildConfig />} />
                <Route path="/settings" element={<Settings />} />
            </Route>

        </Routes>
    );
}

export default App;