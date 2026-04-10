import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import UserDashboard from "../pages/user/UserDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard"; // 🔥 NEW

const Dummy = ({ text }) => <h1>{text}</h1>;

const AppRoutes = () => {
    return (
        <Routes>
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}

            {/* ADMIN (UPDATED 🔥) */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* DRIVER */}
            <Route
                path="/driver"
                element={
                    <ProtectedRoute allowedRoles={["DRIVER"]}>
                        <Dummy text="Driver Dashboard" />
                    </ProtectedRoute>
                }
            />

            {/* USER */}
            <Route
                path="/user"
                element={
                    <ProtectedRoute allowedRoles={["USER"]}>
                        <UserDashboard />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

export default AppRoutes;