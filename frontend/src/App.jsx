/**
 * App.jsx — Main Router
 *
 * Defines which page component renders at which URL path.
 * Also handles basic auth redirection:
 *  - If not logged in → redirect to /login
 *  - If logged in → show the page for the user's role
 *
 * Routes:
 *  /login    → LoginPage
 *  /citizen  → CitizenPage
 *  /officer  → OfficerPage
 *  /admin    → AdminPage
 */

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage   from "./pages/LoginPage";
import CitizenPage from "./pages/CitizenPage";
import OfficerPage from "./pages/OfficerPage";
import AdminPage   from "./pages/AdminPage";

// ─────────────────────────────────────────────
// HELPER — Get logged-in user from localStorage
// ─────────────────────────────────────────────

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("civicchain_user"));
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// PROTECTED ROUTE — only renders if logged in
// ─────────────────────────────────────────────

function ProtectedRoute({ children, allowedRole }) {
  const user = getUser();

  // Not logged in → go to login page
  if (!user) return <Navigate to="/login" replace />;

  // Wrong role → go back to login
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Default route → login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected pages — each is role-restricted */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute allowedRole="citizen">
              <CitizenPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/officer"
          element={
            <ProtectedRoute allowedRole="officer">
              <OfficerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}