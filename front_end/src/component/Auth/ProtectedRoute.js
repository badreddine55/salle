import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // No token: Redirect to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // No role or invalid role: Redirect to login
  if (!role || !["Superadmin", "User"].includes(role)) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return <Navigate to="/" replace />;
  }

  // Role not allowed: Redirect based on role
  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === "Superadmin" ? "/Dashboard" : "/DashboardUser"} replace />;
  }

  // Authorized: Render children
  return children;
};

export default ProtectedRoute;