import {
  ArrowRightLeft,
  BarChart3,
  Boxes,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  PackageCheck,
  PackageOpen,
  PackagePlus,
  RotateCcw,
  Wrench,
} from "lucide-react";
import RoleDashboard from "../../components/dashboard/RoleDashboard";

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

export default function Dashboard() {
  const assets = read("assetflow_assets");
  const allocations = read("assetflow_allocations");
  const transfers = read("assetflow_transfers");
  const returns = read("assetflow_returns");
  const bookings = read("assetflow_bookings");
  const maintenance = read("assetflow_maintenance_requests");
  const audits = read("assetflow_audit_cycles");
  const overdue = read("assetflow_overdue_allocations");
  const activeAllocations = allocations.filter(
    (item) => item.status === "Active",
  );
  const countStatus = (status) =>
    assets.filter((item) => item.status === status).length;
  const total = Math.max(1, assets.length);
  const percent = (value) =>
    Math.max(value ? 8 : 0, Math.round((value / total) * 100));
  const recentAssets = [...assets].reverse().slice(0, 5);
  const today = new Date().toISOString().slice(0, 10);
  const openAudits = audits.filter((item) => item.status !== "Closed");

  return (
    <RoleDashboard
      eyebrow="Asset operations"
      description="Manage the same live asset inventory, custody, bookings, maintenance and audits shared with Admin."
      primaryAction={{
        label: "Open Asset Directory",
        path: "/asset-manager/assets",
        Icon: PackagePlus,
      }}
      metrics={[
        {
          label: "Total Assets",
          value: assets.length,
          Icon: Boxes,
          detail: "Central organization registry",
        },
        {
          label: "Available Assets",
          value: countStatus("Available"),
          Icon: PackageOpen,
          detail: "Ready for allocation",
        },
        {
          label: "Allocated Assets",
          value: countStatus("Allocated"),
          Icon: PackageCheck,
          detail: `${activeAllocations.length} active custody records`,
        },
        {
          label: "Under Maintenance",
          value: countStatus("Under Maintenance"),
          Icon: Wrench,
          detail: `${maintenance.filter((item) => ["High", "Critical"].includes(item.priority) && item.status !== "Resolved").length} high-priority requests`,
        },
        {
          label: "Active Bookings",
          value: bookings.filter(
            (item) => !["Cancelled", "Completed"].includes(item.status),
          ).length,
          Icon: CalendarCheck,
          detail: "Shared resources in use",
        },
        {
          label: "Pending Transfers",
          value: transfers.filter((item) => item.status === "Requested").length,
          Icon: ArrowRightLeft,
          detail: "Awaiting approval",
        },
        {
          label: "Overdue Returns",
          value: overdue.length,
          Icon: Clock3,
          detail: "Require follow-up",
        },
        {
          label: "Open Audit Cycles",
          value: openAudits.length,
          Icon: ClipboardCheck,
          detail: "Verification work remaining",
        },
      ]}
      overview={{
        title: "Operational Overview",
        description: "Live workload across Asset Manager workflows.",
        items: [
          {
            label: "Registered Assets",
            value: assets.length,
            Icon: PackagePlus,
          },
          {
            label: "Active Allocations",
            value: activeAllocations.length,
            Icon: PackageCheck,
          },
          {
            label: "Approved Transfers",
            value: transfers.filter((item) => item.status === "Approved")
              .length,
            Icon: ArrowRightLeft,
          },
          {
            label: "Returns Processed",
            value: returns.length,
            Icon: RotateCcw,
          },
          {
            label: "Maintenance Resolved",
            value: maintenance.filter((item) => item.status === "Resolved")
              .length,
            Icon: Wrench,
          },
          {
            label: "Bookings Today",
            value: bookings.filter(
              (item) => item.date === today && item.status !== "Cancelled",
            ).length,
            Icon: CalendarCheck,
          },
        ],
      }}
      distribution={{
        title: "Asset Status Distribution",
        description: "Current state from the central Admin asset registry.",
        items: [
          {
            label: "Available",
            value: countStatus("Available"),
            percent: percent(countStatus("Available")),
          },
          {
            label: "Allocated",
            value: countStatus("Allocated"),
            percent: percent(countStatus("Allocated")),
          },
          {
            label: "Reserved",
            value: countStatus("Reserved"),
            percent: percent(countStatus("Reserved")),
          },
          {
            label: "Under Maintenance",
            value: countStatus("Under Maintenance"),
            percent: percent(countStatus("Under Maintenance")),
          },
          {
            label: "Lost / Retired / Disposed",
            value:
              countStatus("Lost") +
              countStatus("Retired") +
              countStatus("Disposed"),
            percent: percent(
              countStatus("Lost") +
                countStatus("Retired") +
                countStatus("Disposed"),
            ),
          },
        ],
      }}
      attention={{
        title: "Pending Operations",
        description: "Live items requiring Asset Manager action.",
        items: [
          {
            label: "Active Allocations",
            value: activeAllocations.length,
            Icon: PackageCheck,
            path: "/asset-manager/allocations-transfers",
          },
          {
            label: "Transfer Requests",
            value: transfers.filter((item) => item.status === "Requested")
              .length,
            Icon: ArrowRightLeft,
            path: "/asset-manager/allocations-transfers",
          },
          {
            label: "Overdue Returns",
            value: overdue.length,
            Icon: RotateCcw,
            path: "/asset-manager/allocations-transfers",
          },
          {
            label: "Maintenance Pending",
            value: maintenance.filter((item) => item.status === "Pending")
              .length,
            Icon: Wrench,
            path: "/asset-manager/maintenance",
          },
          {
            label: "Upcoming Bookings",
            value: bookings.filter((item) => item.status !== "Cancelled")
              .length,
            Icon: CalendarCheck,
            path: "/asset-manager/bookings",
          },
          {
            label: "Open Audit Cycles",
            value: openAudits.length,
            Icon: ClipboardCheck,
            path: "/asset-manager/audits",
          },
        ],
      }}
      table={{
        title: "Recently Registered Assets",
        description:
          "Latest records from the shared Admin and Asset Manager directory.",
        path: "/asset-manager/assets",
        headers: [
          "Asset Tag",
          "Asset Name",
          "Category",
          "Location",
          "Status",
          "Acquisition Date",
          "Action",
        ],
        rows: recentAssets.map((item) => [
          item.tag,
          item.name,
          item.category || "Uncategorized",
          item.location || "Not set",
          item.status,
          item.acquisitionDate || "Not set",
        ]),
      }}
      activity={[
        ...transfers
          .slice(-1)
          .map((item) => ({
            text: `Transfer ${item.id} is ${item.status}`,
            time: item.requestedOn || "Recently",
            Icon: ArrowRightLeft,
          })),
        ...maintenance
          .slice(-1)
          .map((item) => ({
            text: `Maintenance ${item.id} is ${item.status}`,
            time: item.raisedOn || "Recently",
            Icon: Wrench,
          })),
        ...bookings
          .slice(-1)
          .map((item) => ({
            text: `${item.resource} booking ${item.status || "confirmed"}`,
            time: item.date || "Recently",
            Icon: CalendarCheck,
          })),
        ...audits
          .slice(-1)
          .map((item) => ({
            text: `${item.name} audit is ${item.status}`,
            time: item.createdOn || "Recently",
            Icon: ClipboardCheck,
          })),
      ].slice(0, 4)}
      quickActions={[
        {
          label: "Register or Find Asset",
          path: "/asset-manager/assets",
          Icon: PackagePlus,
        },
        {
          label: "Manage Allocation & Transfer",
          path: "/asset-manager/allocations-transfers",
          Icon: ArrowRightLeft,
        },
        {
          label: "Open Maintenance Queue",
          path: "/asset-manager/maintenance",
          Icon: Wrench,
        },
        {
          label: "View Operational Reports",
          path: "/asset-manager/reports",
          Icon: BarChart3,
        },
      ]}
    />
  );
}
