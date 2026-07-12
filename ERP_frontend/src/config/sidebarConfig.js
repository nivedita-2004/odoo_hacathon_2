import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Gauge,
  History,
  PackagePlus,
  RotateCcw,
  Users,
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
    ["Asset Directory", "/asset-manager/assets", Boxes],
    ["Register Asset", "/asset-manager/assets/register", PackagePlus],
    ["Allocations", "/asset-manager/allocations", Users],
    ["Transfers", "/asset-manager/transfers", ArrowLeftRight],
    ["Returns", "/asset-manager/returns", RotateCcw],
    ["Resource Bookings", "/asset-manager/bookings", CalendarCheck],
    ["Maintenance", "/asset-manager/maintenance", Wrench],
    ["Audit Assignments", "/asset-manager/audits", ClipboardCheck],
  ],
  [ROLES.DEPARTMENT_HEAD]: [
    ["Dashboard", "/department-head/dashboard", Gauge],
    ["Department Assets", "/department-head/assets", Boxes],
    ["Department Employees", "/department-head/employees", Users],
    [
      "Allocation Requests",
      "/department-head/allocation-requests",
      PackagePlus,
    ],
    ["Transfer Requests", "/department-head/transfer-requests", ArrowLeftRight],
    ["Resource Bookings", "/department-head/bookings", CalendarCheck],
    ["Maintenance", "/department-head/maintenance", Wrench],
    ["Audit Assignments", "/department-head/audits", ClipboardCheck],
  ],
  [ROLES.EMPLOYEE]: [
    ["Dashboard", "/employee/dashboard", Gauge],
    ["My Assets", "/employee/my-assets", Boxes],
    ["Request Asset", "/employee/request-asset", PackagePlus],
    ["Book Resource", "/employee/book-resource", CalendarCheck],
    ["My Bookings", "/employee/my-bookings", History],
    ["Maintenance Requests", "/employee/maintenance", Wrench],
    ["Return Requests", "/employee/return-requests", RotateCcw],
    ["Transfer Requests", "/employee/transfer-requests", ArrowLeftRight],
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
