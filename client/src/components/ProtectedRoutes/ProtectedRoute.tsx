import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole")?.toLowerCase().trim();
    const location = useLocation();

    // 1. If no token is found, redirect to login
    // We save the 'from' location so we can send them back after they log in
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Role-based check (only if you decide to use roles again later)
    if (allowedRoles && allowedRoles.length > 0) {
        if (!userRole || !allowedRoles.includes(userRole)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    // 3. If authenticated, render the children (DashboardLayout and sub-pages)
    return <Outlet />;
};

export default ProtectedRoute;