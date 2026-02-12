import React from "react";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole")?.toLowerCase();

    // 1. If no token is found, send the user to the login page
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. If specific roles are required and the user doesn't have them,
    // redirect them to the main dashboard
    if (allowedRoles && !allowedRoles.includes(userRole || "")) {
        return <Navigate to="/dashboard" replace />;
    }

    // 3. Render the child routes using the Outlet
    return <Outlet />;
};

export default ProtectedRoute;