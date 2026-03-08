import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Authority from "./pages/Authority";
import CreateAsset from "./pages/CreateAsset";
import HeirManagement from "./pages/HeirManagement";
import VerifyAlive from "./pages/VerifyAlive";
import ClaimAsset from "./pages/ClaimAsset";
import NomineeDashboard from "./pages/NomineeDashboard";


// 🛑 THE SECURITY GUARD: Redirects based on role
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || token === "undefined") return <Navigate to="/" replace />;

  // If we require a specific role (like admin) and the user doesn't have it
  if (allowedRole && role !== allowedRole) {
    return (
      <Navigate
        to={role === "nominee" ? "/nominee-dashboard" : "/dashboard"}
        replace
      />
    );
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
       

        {/* 🏠 OWNER ROUTES (The "Giver" Dashboard) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-asset"
          element={
            <ProtectedRoute>
              <CreateAsset />
            </ProtectedRoute>
          }
        />
        <Route
          path="/beneficiaries"
          element={
            <ProtectedRoute>
              <HeirManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-alive"
          element={
            <ProtectedRoute>
              <VerifyAlive />
            </ProtectedRoute>
          }
        />

        {/* 🎁 NOMINEE ROUTES (The "Receiver" Portal) */}
        <Route
          path="/nominee-dashboard"
          element={
            <ProtectedRoute>
              <NomineeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/claim/:id"
          element={
            <ProtectedRoute>
              <ClaimAsset />
            </ProtectedRoute>
          }
        />

        <Route
          path="/authority"
          element={
            <ProtectedRoute allowedRole="admin">
              <Authority />
            </ProtectedRoute>
          }
        />
        {/* Default Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
;