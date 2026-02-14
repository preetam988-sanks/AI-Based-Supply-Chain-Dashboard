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

// const router = createBrowserRouter([
//
//   {
//     path: "/",
//     element: <Navigate to="/login" replace />
//   },
//
//
//   {
//     path: "/login",
//     element: <LoginPage />
//   },
//
//
//   {
//     element: <ProtectedRoute />,
//     children: [
//       {
//         element: <DashboardLayout />,
//         children: [
//           { index: true, element: <Navigate to="/dashboard" replace /> },
//           { path: "dashboard", element: <DashboardPage /> },
//           { path: "inventory", element: <InventoryPage /> },
//           { path: "logistics", element: <LogisticsPage /> },
//           { path: "import", element: <ImportPage /> },
//           { path: "orders", element: <OrdersPage /> },
//
//
//           {
//             element: <ProtectedRoute allowedRoles={["admin"]} />,
//             children: [
//               { path: "analytics", element: <AnalyticsPage /> },
//               { path: "forecast", element: <ForecastPage /> },
//               { path: "users", element: <UsersPage /> },
//               { path: "prediction", element: <PredictionPage /> },
//             ],
//           },
//         ],
//       },
//     ],
//   },
// ]);
import SignupPage from "@/pages/SignUpPage";
import ForgotPasswordPage from "@/pages/ResetPassword.tsx";

const router = createBrowserRouter([
  // PUBLIC ROUTES
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },

  // PROTECTED ROUTES
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/inventory", element: <InventoryPage /> },
          { path: "/logistics", element: <LogisticsPage /> },
          { path: "/import", element: <ImportPage /> },
          { path: "/orders", element: <OrdersPage /> },
          { path: "/analytics", element: <AnalyticsPage /> },
          { path: "/forecast", element: <ForecastPage /> },
          { path: "/users", element: <UsersPage /> },
          { path: "/prediction", element: <PredictionPage /> },
        ],
      },
    ],
  },

  // FALLBACK
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
);