import { Navigate, Outlet } from "react-router-dom";
import Loader from "../components/common/Loader";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
