import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import PropTypes from "prop-types";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RoleSelection from "./components/RoleSelection";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import NormalAdminDashboard from "./components/NormalAdminDashboard";
import UserDashboard from "./components/UserDashboard";
import "./App.css";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// ✅ Fix PropTypes warning
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case "superadmin":
      return <SuperAdminDashboard />;
    case "normaladmin":
      return <NormalAdminDashboard />;
    case "user":
      return <UserDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
