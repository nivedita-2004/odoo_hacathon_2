import {
  ArrowRightLeft,
  Boxes,
  CalendarCheck,
  ClipboardCheck,
  PackageCheck,
  PackageOpen,
  PackagePlus,
  RotateCcw,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import RoleDashboard from "../../components/dashboard/RoleDashboard";
import useAuth from "../../hooks/useAuth";

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const department = user?.department || "Unassigned";
  const assets = read("assetflow_assets").filter(
    (item) => item.department === department,
  );
  const employees = read("assetflow_employees").filter(
    (item) => item.department === department,
  );
  const allocations = read("assetflow_allocations").filter(
    (item) => item.department === department,
  );
  const requests = read("assetflow_allocation_requests").filter(
    (item) => item.department === department,
  );
  const transfers = read("assetflow_transfers").filter(
    (item) => item.department === department,
  );
  const bookings = read("assetflow_bookings").filter(
    (item) => item.department === department,
  );
  const tags = new Set(assets.map((item) => item.tag));
  const maintenance = read("assetflow_maintenance_requests").filter((item) =>
    tags.has(item.assetTag),
  );
  const audits = read("assetflow_audit_cycles").filter(
    (item) =>
      (item.scopeType === "Department" && item.scopeValue === department) ||
      item.auditors?.includes(user.fullName),
  );
  const activeAllocations = allocations.filter(
    (item) => item.status === "Active",
  );
  const total = Math.max(1, assets.length);
  const categories = assets.reduce(
    (result, item) => ({
      ...result,
      [item.category || "Uncategorized"]:
        (result[item.category || "Uncategorized"] || 0) + 1,
    }),
    {},
  );
  const recent = assets.slice(-5).reverse();
  return (
    <RoleDashboard
      eyebrow={department}
      description="Monitor only your department assets, employees, requests, bookings, maintenance and assigned audits."
      primaryAction={{
        label: "Review Requests",
        path: "/department-head/allocations-transfers",
        Icon: UserCheck,
      }}
      metrics={[
        {
          label: "Department Assets",
          value: assets.length,
          Icon: Boxes,
          detail: `${Object.keys(categories).length} categories`,
        },
        {
          label: "Department Employees",
          value: employees.length,
          Icon: Users,
          detail: `${employees.filter((item) => item.status === "Active").length} active employees`,
        },
        {
          label: "Allocated Assets",
          value: assets.filter((item) => item.status === "Allocated").length,
          Icon: PackageCheck,
          detail: `${activeAllocations.length} active records`,
        },
        {
          label: "Available Assets",
          value: assets.filter((item) => item.status === "Available").length,
          Icon: PackageOpen,
          detail: "Visible within department",
        },
        {
          label: "Allocation Requests",
          value: requests.filter((item) => item.status === "Pending").length,
          Icon: PackagePlus,
          detail: "Awaiting your decision",
        },
        {
          label: "Transfer Requests",
          value: transfers.filter((item) => item.status === "Requested").length,
          Icon: ArrowRightLeft,
          detail: "Awaiting your decision",
        },
        {
          label: "Maintenance Cases",
          value: maintenance.filter(
            (item) => !["Resolved", "Rejected"].includes(item.status),
          ).length,
          Icon: Wrench,
          detail: "Department assets only",
        },
        {
          label: "Audit Assignments",
          value: audits.filter((item) => item.status !== "Closed").length,
          Icon: ClipboardCheck,
          detail: "Assigned or department-scoped",
        },
      ]}
      overview={{
        title: "Department Overview",
        description: "Live activity for your department.",
        items: [
          {
            label: "Active Employees",
            value: employees.filter((item) => item.status === "Active").length,
            Icon: Users,
          },
          {
            label: "Active Allocations",
            value: activeAllocations.length,
            Icon: PackageCheck,
          },
          {
            label: "Requests Approved",
            value: requests.filter((item) => item.status.startsWith("Approved"))
              .length,
            Icon: UserCheck,
          },
          {
            label: "Assets Returned",
            value: allocations.filter((item) => item.status === "Returned")
              .length,
            Icon: RotateCcw,
          },
          {
            label: "Maintenance Resolved",
            value: maintenance.filter((item) => item.status === "Resolved")
              .length,
            Icon: Wrench,
          },
          {
            label: "Resource Bookings",
            value: bookings.filter((item) => item.status !== "Cancelled")
              .length,
            Icon: CalendarCheck,
          },
        ],
      }}
      distribution={{
        title: "Assets by Category",
        description: "Department inventory composition.",
        items: Object.entries(categories)
          .slice(0, 5)
          .map(([label, value]) => ({
            label,
            value,
            percent: Math.max(8, Math.round((value / total) * 100)),
          })),
      }}
      attention={{
        title: "Items Requiring Review",
        description: "Only requests and tasks for your department.",
        items: [
          {
            label: "Allocation Requests",
            value: requests.filter((item) => item.status === "Pending").length,
            Icon: PackagePlus,
            path: "/department-head/allocations-transfers",
          },
          {
            label: "Transfer Requests",
            value: transfers.filter((item) => item.status === "Requested")
              .length,
            Icon: ArrowRightLeft,
            path: "/department-head/allocations-transfers",
          },
          {
            label: "Maintenance Cases",
            value: maintenance.filter(
              (item) => !["Resolved", "Rejected"].includes(item.status),
            ).length,
            Icon: Wrench,
            path: "/department-head/maintenance",
          },
          {
            label: "Department Bookings",
            value: bookings.filter((item) => item.status !== "Cancelled")
              .length,
            Icon: CalendarCheck,
            path: "/department-head/bookings",
          },
          {
            label: "Audit Tasks",
            value: audits
              .flatMap((item) => item.items || [])
              .filter((item) => item.result === "Pending").length,
            Icon: ClipboardCheck,
            path: "/department-head/audits",
          },
          {
            label: "Inactive Employees",
            value: employees.filter((item) => item.status === "Inactive")
              .length,
            Icon: Users,
            path: "/department-head/assets",
          },
        ],
      }}
      table={{
        title: "Department Assets",
        description: "Latest assets assigned to your department.",
        path: "/department-head/assets",
        headers: [
          "Asset Tag",
          "Asset Name",
          "Current Holder",
          "Category",
          "Location",
          "Condition",
          "Action",
        ],
        rows: recent.map((item) => [
          item.tag,
          item.name,
          item.holder || "Unassigned",
          item.category || "Uncategorized",
          item.location || "Not set",
          item.condition || "Not set",
        ]),
      }}
      activity={[
        ...requests
          .slice(-1)
          .map((item) => ({
            text: `${item.id} is ${item.status}`,
            time: item.requestedOn || "Recently",
            Icon: UserCheck,
          })),
        ...transfers
          .slice(-1)
          .map((item) => ({
            text: `${item.id} is ${item.status}`,
            time: item.requestedOn || "Recently",
            Icon: ArrowRightLeft,
          })),
        ...maintenance
          .slice(-1)
          .map((item) => ({
            text: `${item.id} is ${item.status}`,
            time: item.raisedOn || "Recently",
            Icon: Wrench,
          })),
        ...audits
          .slice(-1)
          .map((item) => ({
            text: `${item.name} is ${item.status}`,
            time: item.createdOn || "Recently",
            Icon: ClipboardCheck,
          })),
      ]}
      quickActions={[
        {
          label: "Review Allocation & Transfer",
          path: "/department-head/allocations-transfers",
          Icon: ArrowRightLeft,
        },
        {
          label: "View Department Assets & Employees",
          path: "/department-head/assets",
          Icon: Boxes,
        },
        {
          label: "Book Shared Resource",
          path: "/department-head/bookings",
          Icon: CalendarCheck,
        },
        {
          label: "Perform Assigned Audit",
          path: "/department-head/audits",
          Icon: ClipboardCheck,
        },
      ]}
    />
  );
}
