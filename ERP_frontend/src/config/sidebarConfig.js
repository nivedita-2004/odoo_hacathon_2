import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Gauge,
  Wrench,
} from "lucide-react";
import { ROLES } from "./roles";

const common = [
  { label: "Notifications", path: "/notifications", icon: Bell },
];
export const sidebarConfig = {
  [ROLES.ADMIN]: [
    ["Dashboard", "/admin/dashboard", Gauge],
    ["Organization Setup", "/admin/organization-setup", Building2],
    ["Assets", "/admin/assets", Boxes],
    ["Allocations & Transfers", "/admin/allocations-transfers", ArrowLeftRight],
    ["Resource Bookings", "/admin/bookings", CalendarCheck],
    ["Maintenance", "/admin/maintenance", Wrench],
    ["Audits", "/admin/audits", ClipboardCheck],
    ["Reports", "/admin/reports", BookOpen],
  ],
  [ROLES.ASSET_MANAGER]: [
    ["Dashboard", "/asset-manager/dashboard", Gauge],
    ["Assets", "/asset-manager/assets", Boxes],
    ["Allocation & Transfer", "/asset-manager/allocations-transfers", ArrowLeftRight],
    ["Resource Booking", "/asset-manager/bookings", CalendarCheck],
    ["Maintenance", "/asset-manager/maintenance", Wrench],
    ["Audit", "/asset-manager/audits", ClipboardCheck],
    ["Reports", "/asset-manager/reports", BookOpen],
  ],
  [ROLES.DEPARTMENT_HEAD]: [
    ["Dashboard", "/department-head/dashboard", Gauge],
    ["Department Assets", "/department-head/assets", Boxes],
    ["Allocation & Transfer", "/department-head/allocations-transfers", ArrowLeftRight],
    ["Resource Booking", "/department-head/bookings", CalendarCheck],
    ["Maintenance", "/department-head/maintenance", Wrench],
    ["Audit", "/department-head/audits", ClipboardCheck],
  ],
  [ROLES.EMPLOYEE]: [
    ["Dashboard", "/employee/dashboard", Gauge],
    ["My Assets", "/employee/my-assets", Boxes],
    ["Resource Booking", "/employee/bookings", CalendarCheck],
    ["Maintenance Requests", "/employee/maintenance", Wrench],
    ["Return & Transfer Requests", "/employee/return-transfer-requests", ArrowLeftRight],
  ],
};

Object.keys(sidebarConfig).forEach((role) => {
  sidebarConfig[role] = [
    ...sidebarConfig[role].map(([label, path, icon]) => ({
      label,
      path,
      icon,
    })),
    ...common,
  ];
});
