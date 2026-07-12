import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  BookOpen,
  Boxes,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileBarChart,
  FolderPlus,
  PackageCheck,
  PackageOpen,
  RotateCcw,
  ShieldAlert,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

const defaultBooking = [
  ["Active Bookings", "34"],
  ["Upcoming Today", "16"],
  ["Most Used Resource", "Meeting Room B2"],
  ["Cancelled This Month", "7"],
  ["Peak Booking Time", "11 AM–2 PM"],
];

const activities = [
  ["Asset AF-0214 registered", "Priya Sharma", "10 minutes ago", "Assets"],
  [
    "Rahul promoted to Department Head",
    "System Admin",
    "35 minutes ago",
    "Employees",
  ],
  [
    "Maintenance request MR-102 approved",
    "Amit Patel",
    "1 hour ago",
    "Maintenance",
  ],
  ["Audit Cycle Q3-IT created", "System Admin", "2 hours ago", "Audits"],
  [
    "Meeting Room B2 booking cancelled",
    "Neha Kapoor",
    "3 hours ago",
    "Bookings",
  ],
];

const quickActions = [
  ["Add Department", "/admin/organization-setup", Building2],
  ["Add Asset Category", "/admin/organization-setup", FolderPlus],
  ["Open Employee Directory", "/admin/organization-setup", Users],
  ["Create Audit Cycle", "/admin/audits", ClipboardCheck],
  ["View Reports", "/admin/reports", FileBarChart],
  ["View Activity Logs", "/notifications", Activity],
];

function Section({ title, description, action, children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#31232e]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricList({ items }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-[#faf8fa] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-xl font-semibold text-[#4f3448]">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const read = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  };
  const assets = read("assetflow_assets");
  const allocations = read("assetflow_allocations");
  const transfers = read("assetflow_transfers");
  const bookingsData = read("assetflow_bookings");
  const maintenanceRequests = read("assetflow_maintenance_requests");
  const auditCycles = read("assetflow_audit_cycles");
  const overdueData = read("assetflow_overdue_allocations");
  const employeesData = read("assetflow_employees");
  const activeAllocations = allocations.filter((item) => item.status === "Active");
  const countStatus = (status) => assets.filter((item) => item.status === status).length;
  const totalAssets = assets.length;
  const openAudits = auditCycles.filter((item) => item.status !== "Closed");
  const auditFlags = auditCycles.flatMap((cycle) => cycle.items || []).filter((item) => ["Missing", "Damaged"].includes(item.result));
  const activeBookings = bookingsData.filter((item) => !["Cancelled", "Completed"].includes(item.status)).length;
  const kpis = [
    { label: "Total Assets", value: totalAssets, Icon: Boxes, tone: "bg-[#f1eaf0] text-[#4f3448]" },
    { label: "Available Assets", value: countStatus("Available"), Icon: PackageOpen, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Allocated Assets", value: countStatus("Allocated"), Icon: PackageCheck, tone: "bg-blue-50 text-blue-700" },
    { label: "Under Maintenance", value: countStatus("Under Maintenance"), Icon: Wrench, tone: "bg-amber-50 text-amber-700" },
    { label: "Active Bookings", value: activeBookings, Icon: CalendarDays, tone: "bg-violet-50 text-violet-700" },
    { label: "Pending Transfers", value: transfers.filter((item) => item.status === "Requested").length, Icon: ArrowRightLeft, tone: "bg-cyan-50 text-cyan-700" },
    { label: "Overdue Returns", value: overdueData.length, Icon: Clock3, tone: "bg-red-50 text-red-700" },
    { label: "Open Audit Cycles", value: openAudits.length, Icon: ClipboardCheck, tone: "bg-orange-50 text-orange-700" },
  ];
  const statusColors = { Available: "bg-emerald-500", Allocated: "bg-blue-500", Reserved: "bg-violet-500", "Under Maintenance": "bg-amber-500", Lost: "bg-red-500", Retired: "bg-slate-500", Disposed: "bg-gray-400" };
  const assetStatuses = Object.entries(statusColors).map(([status, color]) => [status, countStatus(status), color]);
  const departmentMap = activeAllocations.reduce((result, item) => ({ ...result, [item.department || "Unassigned"]: (result[item.department || "Unassigned"] || 0) + 1 }), {});
  const departments = Object.entries(departmentMap).length ? Object.entries(departmentMap) : [["No allocations yet", 0]];
  const pendingActions = [
    ["Transfer Requests Pending", transfers.filter((item) => item.status === "Requested").length, ArrowRightLeft, "/admin/allocations-transfers"],
    ["Maintenance Requests Pending", maintenanceRequests.filter((item) => item.status === "Pending").length, Wrench, "/admin/maintenance"],
    ["Return Requests Pending", activeAllocations.filter((item) => item.expectedReturn).length, RotateCcw, "/admin/allocations-transfers"],
    ["Audit Discrepancies", auditFlags.length, ShieldAlert, "/admin/audits"],
    ["Overdue Returns", overdueData.length, Clock3, "/admin/allocations-transfers"],
    ["Inactive Records to Review", employeesData.filter((item) => item.status === "Inactive").length, UserCog, "/admin/organization-setup"],
  ];
  const overdueReturns = overdueData.map((item) => [item.assetTag, item.assetName, item.holder, item.department, item.expectedReturn, "Overdue", "Overdue"]);
  const maintenance = [
    ["Raised This Month", maintenanceRequests.length], ["Pending", maintenanceRequests.filter((item) => item.status === "Pending").length], ["In Progress", maintenanceRequests.filter((item) => item.status === "In Progress").length],
    ["Resolved", maintenanceRequests.filter((item) => item.status === "Resolved").length], ["Critical", maintenanceRequests.filter((item) => item.priority === "Critical" && item.status !== "Resolved").length], ["Frequent Repairs", assets.filter((item) => (item.maintenanceHistory || []).length > 2).length],
  ];
  const booking = bookingsData.length ? [
    ["Active Bookings", activeBookings], ["Upcoming Today", bookingsData.filter((item) => item.date === new Date().toISOString().slice(0, 10) && item.status !== "Cancelled").length],
    ["Most Used Resource", bookingsData.length ? Object.entries(bookingsData.reduce((result, item) => ({ ...result, [item.resource]: (result[item.resource] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0]?.[0] : "No bookings"],
    ["Cancelled This Month", bookingsData.filter((item) => item.status === "Cancelled").length], ["Peak Booking Time", bookingsData.length ? "See analytics" : "No data"],
  ] : defaultBooking;
  const audit = [
    ["Open Audit Cycles", openAudits.length], ["Upcoming Audits", auditCycles.filter((item) => item.status === "Open").length], ["Assets Verified", auditCycles.flatMap((item) => item.items || []).filter((item) => item.result === "Verified").length],
    ["Missing Assets", auditFlags.filter((item) => item.result === "Missing").length], ["Damaged Assets", auditFlags.filter((item) => item.result === "Damaged").length], ["Open Discrepancies", auditFlags.length],
  ];
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 bg-[#fbfafb]">
     

      <section className="grid grid-cols-4 gap-4">
        {kpis.map(({ label, value, Icon, tone }) => (
          <div
            key={label}
            className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold text-[#31232e]">
                  {value}
                </p>
              </div>
              <div className={`rounded-lg p-2.5 ${tone}`}>
                <Icon size={21} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-5 gap-6">
        <Section
          className="col-span-3"
          title="Asset Status Overview"
          description="Current distribution across the asset lifecycle."
        >
          <div className="space-y-4">
            {assetStatuses.map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="font-semibold text-[#31232e]">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${value ? Math.max(8, (value / Math.max(1, totalAssets)) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section
          className="col-span-2"
          title="Department-wise Allocation"
          description="Assets currently used by each department."
        >
          <div className="space-y-3">
            {departments.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#f1eaf0] p-2 text-[#4f3448]">
                    <Building2 size={17} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[#4f3448]">
                  {count} assets
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section
        title="Pending Actions"
        description="Items that currently require administrator attention."
      >
        <div className="grid grid-cols-3 gap-3">
          {pendingActions.map(([label, count, Icon, path]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-[#eadfe7] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-[#31232e]">
                    {count}
                  </p>
                  <p className="text-sm text-slate-600">{label}</p>
                </div>
              </div>
              <Link
                className="inline-flex items-center gap-1 text-sm font-medium text-[#4f3448] hover:underline"
                to={path}
              >
                View <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Overdue Returns"
        description="Allocations that have passed their expected return date."
        action={
          <Link
            className="text-sm font-medium text-[#4f3448] hover:underline"
            to="/admin/reports"
          >
            View all returns
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#e6dee4] text-xs uppercase tracking-wide text-slate-500">
                {[
                  "Asset Tag",
                  "Asset Name",
                  "Employee",
                  "Department",
                  "Expected Return",
                  "Overdue",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th key={heading} className="px-3 py-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overdueReturns.map((row) => (
                <tr
                  key={row[0]}
                  className="border-b border-slate-100 last:border-0"
                >
                  {row.map((cell, index) => (
                    <td key={index} className="px-3 py-4 text-slate-600">
                      {index === 0 ? (
                        <span className="font-semibold text-[#4f3448]">
                          {cell}
                        </span>
                      ) : index === 6 ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-4">
                    <div className="flex gap-3">
                      <button className="font-medium text-[#4f3448] hover:underline">
                        View Details
                      </button>
                      <button className="font-medium text-amber-700 hover:underline">
                        Send Reminder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-6">
        <Section
          title="Maintenance Overview"
          description="Maintenance workload and resolution health."
          action={<Wrench className="text-[#4f3448]" size={21} />}
        >
          <MetricList items={maintenance} />
        </Section>
        <Section
          title="Resource Booking Overview"
          description="Shared resource usage and booking trends."
          action={<BookOpen className="text-[#4f3448]" size={21} />}
        >
          <MetricList items={booking} />
        </Section>
      </div>

      <Section
        title="Audit Overview"
        description="Verification progress and unresolved audit findings."
        action={<ClipboardCheck className="text-[#4f3448]" size={21} />}
      >
        <MetricList items={audit} />
      </Section>

      <Section
        title="Recent Activity"
        description="Latest actions recorded across AssetFlow."
        action={
          <Link
            className="text-sm font-medium text-[#4f3448] hover:underline"
            to="/notifications"
          >
            View activity logs
          </Link>
        }
      >
        <div className="divide-y divide-slate-100">
          {activities.map(([action, user, time, module]) => (
            <div
              key={action}
              className="grid grid-cols-[1fr_180px_150px_110px] items-center gap-2 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#f1eaf0] p-2 text-[#4f3448]">
                  <Activity size={16} />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {action}
                </span>
              </div>
              <span className="text-sm text-slate-500">{user}</span>
              <span className="text-sm text-slate-500">{time}</span>
              <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {module}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Quick Actions"
        description="Common administrator shortcuts."
      >
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(([label, path, Icon]) => (
            <Link
              key={label}
              className="group flex items-center justify-between rounded-lg border border-[#e6dee4] p-4 transition hover:border-[#4f3448] hover:bg-[#faf7f9]"
              to={path}
            >
              <span className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <Icon className="text-[#4f3448]" size={19} />
                {label}
              </span>
              <ArrowRight
                className="text-slate-400 group-hover:text-[#4f3448]"
                size={17}
              />
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
