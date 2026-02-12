import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import "@/index.css";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import OrdersPage from "@/pages/OrdersPage";
import InventoryPage from "@/pages/InventoryPage";
import LogisticsPage from "@/pages/LogisticsPage";
import UsersPage from "@/pages/UsersPage";
import ImportPage from "@/pages/ImportPage";
import ForecastPage from "@/pages/ForecastPage";
import ProtectedRoute from "@/components/ProtectedRoutes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import PredictionPage from "@/pages/PredictionPage.tsx";

const router = createBrowserRouter([
  // Public Route
  { path: "/login", element: <LoginPage /> },

  // Secure Routes
  {
    element: <ProtectedRoute />, // Validates that a token exists
    children: [
      {
        element: <DashboardLayout />, // Provides the Sidebar and Header once
        children: [
          // Standard User & Admin Routes
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/inventory", element: <InventoryPage /> },
          { path: "/logistics", element: <LogisticsPage /> },
          { path: "/import", element: <ImportPage /> },
          { path: "/orders", element: <OrdersPage /> },

          // Strict Admin-Only Routes
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [
              { path: "/analytics", element: <AnalyticsPage /> },
              { path: "/forecast", element: <ForecastPage /> },
              { path: "/users", element: <UsersPage /> },
              {path:"/prediction",element:<PredictionPage /> },

            ],
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(

      <RouterProvider router={router} />

);