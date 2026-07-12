import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RoleBasedRoute({ allowedRoles }) {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(allowedRoles) ? (
    <Outlet />
  ) : (
    <Navigate to="/unauthorized" replace />
  );
}
