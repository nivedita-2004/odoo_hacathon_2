import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROLES } from "../config/roles";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import AdminDashboard from "../pages/admin/Dashboard";
import AuditCycles from "../pages/admin/AuditCycles";
import Reports from "../pages/admin/Reports";
import OrganizationSetup from "../pages/admin/OrganizationSetup";
import AdminAssets from "../pages/admin/Assets";
import AdminAllocationTransfers from "../pages/admin/AllocationTransfers";
import AdminBookings from "../pages/admin/ResourceBookings";
import AdminMaintenance from "../pages/admin/Maintenance";
import ManagerDashboard from "../pages/assetManager/Dashboard";
import Assets from "../pages/assetManager/Assets";
import Allocations from "../pages/assetManager/Allocations";
import ManagerBookings from "../pages/assetManager/Bookings";
import ManagerMaintenance from "../pages/assetManager/Maintenance";
import ManagerAudits from "../pages/assetManager/AuditAssignments";
import ManagerReports from "../pages/assetManager/Reports";
import HeadDashboard from "../pages/departmentHead/Dashboard";
import DepartmentAssets from "../pages/departmentHead/DepartmentAssets";
import AllocationRequests from "../pages/departmentHead/AllocationRequests";
import HeadBookings from "../pages/departmentHead/Bookings";
import HeadMaintenance from "../pages/departmentHead/Maintenance";
import HeadAudits from "../pages/departmentHead/AuditAssignments";
import EmployeeDashboard from "../pages/employee/Dashboard";
import MyAssets from "../pages/employee/MyAssets";
import EmployeeBookings from "../pages/employee/Bookings";
import EmployeeMaintenance from "../pages/employee/Maintenance";
import ReturnRequests from "../pages/employee/ReturnRequests";
import Notifications from "../pages/common/Notifications";
import Profile from "../pages/common/Profile";
import Unauthorized from "../pages/errors/Unauthorized";
import NotFound from "../pages/errors/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

const roleRoutes = [
  {
    role: ROLES.ADMIN,
    routes: [
      ["admin/dashboard", AdminDashboard],
      ["admin/organization-setup", OrganizationSetup],
      ["admin/assets", AdminAssets],
      ["admin/allocations-transfers", AdminAllocationTransfers],
      ["admin/bookings", AdminBookings],
      ["admin/maintenance", AdminMaintenance],
      ["admin/audits", AuditCycles],
      ["admin/reports", Reports],
    ],
  },
  {
    role: ROLES.ASSET_MANAGER,
    routes: [
      ["asset-manager/dashboard", ManagerDashboard],
      ["asset-manager/assets", Assets],
      ["asset-manager/allocations-transfers", Allocations],
      ["asset-manager/bookings", ManagerBookings],
      ["asset-manager/maintenance", ManagerMaintenance],
      ["asset-manager/audits", ManagerAudits],
      ["asset-manager/reports", ManagerReports],
    ],
  },
  {
    role: ROLES.DEPARTMENT_HEAD,
    routes: [
      ["department-head/dashboard", HeadDashboard],
      ["department-head/assets", DepartmentAssets],
      ["department-head/allocations-transfers", AllocationRequests],
      ["department-head/bookings", HeadBookings],
      ["department-head/maintenance", HeadMaintenance],
      ["department-head/audits", HeadAudits],
    ],
  },
  {
    role: ROLES.EMPLOYEE,
    routes: [
      ["employee/dashboard", EmployeeDashboard],
      ["employee/my-assets", MyAssets],
      ["employee/bookings", EmployeeBookings],
      ["employee/maintenance", EmployeeMaintenance],
      ["employee/return-transfer-requests", ReturnRequests],
    ],
  },
];

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {roleRoutes.map(({ role, routes }) => (
              <Route
                key={role}
                element={<RoleBasedRoute allowedRoles={[role]} />}
              >
                {routes.map(([path, Page]) => (
                  <Route key={path} path={path} element={<Page />} />
                ))}
              </Route>
            ))}
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
