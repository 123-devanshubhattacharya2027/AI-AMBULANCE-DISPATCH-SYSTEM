import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import UserDashboard from "../pages/user/UserDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import DriverDashboard from "../pages/driver/DriverDashboard"; // 🔥 ADD THIS

const AppRoutes = () => {
    return (
        <Routes>
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ========================= */}
            {/* 🔒 PROTECTED ROUTES */}
            {/* ========================= */}

            {/* ADMIN */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* DRIVER ✅ FIXED */}
            <Route
                path="/driver"
                element={
                    <ProtectedRoute allowedRoles={["DRIVER"]}>
                        <DriverDashboard />   {/* 🔥 REAL COMPONENT */}
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