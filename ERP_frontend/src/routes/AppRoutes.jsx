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
import RegisterAsset from "../pages/assetManager/RegisterAsset";
import Allocations from "../pages/assetManager/Allocations";
import ManagerTransfers from "../pages/assetManager/Transfers";
import Returns from "../pages/assetManager/Returns";
import ManagerBookings from "../pages/assetManager/Bookings";
import ManagerMaintenance from "../pages/assetManager/Maintenance";
import ManagerAudits from "../pages/assetManager/AuditAssignments";
import HeadDashboard from "../pages/departmentHead/Dashboard";
import DepartmentAssets from "../pages/departmentHead/DepartmentAssets";
import DepartmentEmployees from "../pages/departmentHead/DepartmentEmployees";
import AllocationRequests from "../pages/departmentHead/AllocationRequests";
import HeadTransfers from "../pages/departmentHead/TransferRequests";
import HeadBookings from "../pages/departmentHead/Bookings";
import HeadMaintenance from "../pages/departmentHead/Maintenance";
import HeadAudits from "../pages/departmentHead/AuditAssignments";
import EmployeeDashboard from "../pages/employee/Dashboard";
import MyAssets from "../pages/employee/MyAssets";
import RequestAsset from "../pages/employee/RequestAsset";
import BookResource from "../pages/employee/BookResource";
import MyBookings from "../pages/employee/MyBookings";
import EmployeeMaintenance from "../pages/employee/Maintenance";
import ReturnRequests from "../pages/employee/ReturnRequests";
import EmployeeTransfers from "../pages/employee/TransferRequests";
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
      ["asset-manager/assets/register", RegisterAsset],
      ["asset-manager/allocations", Allocations],
      ["asset-manager/transfers", ManagerTransfers],
      ["asset-manager/returns", Returns],
      ["asset-manager/bookings", ManagerBookings],
      ["asset-manager/maintenance", ManagerMaintenance],
      ["asset-manager/audits", ManagerAudits],
    ],
  },
  {
    role: ROLES.DEPARTMENT_HEAD,
    routes: [
      ["department-head/dashboard", HeadDashboard],
      ["department-head/assets", DepartmentAssets],
      ["department-head/employees", DepartmentEmployees],
      ["department-head/allocation-requests", AllocationRequests],
      ["department-head/transfer-requests", HeadTransfers],
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
      ["employee/request-asset", RequestAsset],
      ["employee/book-resource", BookResource],
      ["employee/my-bookings", MyBookings],
      ["employee/maintenance", EmployeeMaintenance],
      ["employee/return-requests", ReturnRequests],
      ["employee/transfer-requests", EmployeeTransfers],
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
