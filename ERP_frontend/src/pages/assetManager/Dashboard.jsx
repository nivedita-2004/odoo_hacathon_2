import { useEffect, useState } from "react";
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
import { API_ENDPOINTS } from "../../config/apis";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("assetflow_token");
        const res = await fetch(API_ENDPOINTS.DASHBOARD.ADMIN, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setData(result.data);
        else setError(result.error || "Failed to load dashboard data");
      } catch (err) {
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-slate-500">Loading dashboard...</div>;
  if (error) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-red-500">{error}</div>;

  const { assets = [], allocations = [], transfers = [], bookingsData = [], maintenanceRequests = [], auditCycles = [], overdueData = [], returnsData = [], activities = [] } = data || {};

  const maintenance = maintenanceRequests;
  const bookings = bookingsData;
  const overdue = overdueData;
  const audits = auditCycles;
  
  const activeAllocations = allocations.filter((item) => item.status === "Active");
  const countStatus = (status) => assets.filter((item) => item.status === status).length;
  const total = Math.max(1, assets.length);
  const percent = (value) => Math.max(value ? 8 : 0, Math.round((value / total) * 100));
  const recentAssets = [...assets].slice(0, 5);
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
            value: transfers.filter((item) => item.status === "Approved").length,
            Icon: ArrowRightLeft,
          },
          {
            label: "Returns Processed",
            value: returnsData.length,
            Icon: RotateCcw,
          },
          {
            label: "Maintenance Resolved",
            value: maintenance.filter((item) => item.status === "Resolved").length,
            Icon: Wrench,
          },
          {
            label: "Bookings Today",
            value: bookings.filter((item) => new Date(item.date).toISOString().slice(0, 10) === today && item.status !== "Cancelled").length,
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
            value: countStatus("Lost") + countStatus("Retired") + countStatus("Disposed"),
            percent: percent(countStatus("Lost") + countStatus("Retired") + countStatus("Disposed")),
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
            value: transfers.filter((item) => item.status === "Requested").length,
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
            value: maintenance.filter((item) => item.status === "Pending").length,
            Icon: Wrench,
            path: "/asset-manager/maintenance",
          },
          {
            label: "Upcoming Bookings",
            value: bookings.filter((item) => item.status !== "Cancelled").length,
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
        description: "Latest records from the shared Admin and Asset Manager directory.",
        path: "/asset-manager/assets",
        headers: [
          "Asset Tag",
          "Asset Name",
          "Category",
          "Location",
          "Status",
          "Acquisition Date",
        ],
        rows: recentAssets.map((item) => [
          item.asset_tag,
          item.name,
          item.category_name || "Uncategorized",
          item.department_name || "Not set",
          item.status,
          item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : "Not set",
        ]),
      }}
      activity={activities.slice(0, 4).map((item) => ({
        text: item.description,
        time: new Date(item.created_at).toLocaleString(),
        Icon: ArrowRightLeft,
      }))}
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
