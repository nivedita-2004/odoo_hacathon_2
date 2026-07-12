import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getRoleDashboard } from "../utils/roleRedirect";

export default function PublicOnlyRoute() {
  const { user } = useAuth();
  return user ? (
    <Navigate to={getRoleDashboard(user.role)} replace />
  ) : (
    <Outlet />
  );
}
