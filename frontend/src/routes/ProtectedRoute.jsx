import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    // ❌ Not logged in
    if (!token) {
        return <Navigate to="/login" />;
    }

    // ❌ Role not allowed
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;