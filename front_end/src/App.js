import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./component/Auth/ProtectedRoute";

// Lazy load components
const Login = lazy(() => import("./component/Auth/Login"));
const Dashboard = lazy(() => import("./component/superadmin/Dashboard"));
const DashboardDrafts = lazy(() => import("./component/superadmin/DashboardDrafts"));
const FormateurManagement = lazy(() => import("./component/superadmin/FormateurManagement"));
const CreateFormateur = lazy(() => import("./component/superadmin/CreateFormateur"));
const EditFormateur = lazy(() => import("./component/superadmin/EditFormateur"));
const EtablissementManagement = lazy(() => import("./component/superadmin/EtablissementManagement"));
const CreateEtablissement = lazy(() => import("./component/superadmin/CreateEtablissement"));
const EditEtablissement = lazy(() => import("./component/superadmin/EditEtablissement"));
const FiliereManagement = lazy(() => import("./component/superadmin/FiliereManagement"));
const CreateFiliere = lazy(() => import("./component/superadmin/CreateFiliere"));
const EditFiliere = lazy(() => import("./component/superadmin/EditFiliere"));
const ProfileSettings = lazy(() => import("./component/superadmin/ProfileSettings"));
const ScheduleHistory = lazy(() => import("./component/superadmin/ScheduleHistory"));
const ScheduleView = lazy(() => import("./component/superadmin/ScheduleView"));
const ImportData = lazy(() => import("./component/superadmin/ImportData"));
const ImportProfs = lazy(() => import("./component/superadmin/ImportProfs"));
const NotFound = lazy(() => import("./component/NotFound"));
const FormateurListWithPDFExport  = lazy(() => import("./component/superadmin/FormateurListWithPDFExport"));
const ConfirmationSchedule  = lazy(() => import("./component/superadmin/ConfirmationSchedule"));
export default function App() {
  return React.createElement(
    BrowserRouter,
    null,
    React.createElement(
      Suspense,
      {
        fallback: React.createElement(
          "div",
          { className: "min-h-screen flex items-center justify-center bg-gray-50" },
          React.createElement(
            "div",
            { className: "flex flex-col items-center" },
            React.createElement(
              "svg",
              {
                className: "animate-spin h-8 w-8 text-[#004AAD] mb-2",
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
              },
              React.createElement("circle", {
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4",
              }),
              React.createElement("path", {
                className: "opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
              })
            ),
            React.createElement("span", { className: "text-gray-600" }, "Chargement...")
          )
        ),
      },
      React.createElement( 
        Routes,
        null,
        // Public Routes
        React.createElement(Route, { path: "/", element: React.createElement(Login) }),

        // Protected Routes for Superadmin
        React.createElement(
          Route,
          {
            path: "/Dashboard",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(Dashboard)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/DashboardDrafts",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(DashboardDrafts)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/FormateurManagement",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(FormateurManagement)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/superadmin/formateurs/create",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(CreateFormateur)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/superadmin/formateurs/edit/:id",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(EditFormateur)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/EtablissementManagement",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(EtablissementManagement)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/superadmin/etablissements/create",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(CreateEtablissement)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/superadmin/etablissements/edit/:id",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(EditEtablissement)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/superadmin/filieres",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(FiliereManagement)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/superadmin/filieres/create",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(CreateFiliere)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/superadmin/filieres/edit/:id",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(EditFiliere)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/superadmin/profile",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(ProfileSettings)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/schedule/history",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(ScheduleHistory)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/schedule-history/:confirmationDate",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(ConfirmationSchedule)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/schedule/view/:historyId",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(ScheduleView)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/ImportData",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(ImportData)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/ImportProfs",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(ImportProfs)),
          }
        ),
        React.createElement(
          Route,
          {
            path: "/FormateurList",
            element: React.createElement(ProtectedRoute, { allowedRoles: ["Superadmin"] }, React.createElement(FormateurListWithPDFExport)),
          }
        ),

        // Fallback Route for 404
        React.createElement(Route, { path: "*", element: React.createElement(NotFound) })
      )
    )
  );
}