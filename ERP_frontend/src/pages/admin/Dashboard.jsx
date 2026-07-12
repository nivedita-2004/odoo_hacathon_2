import {
  Activity, ArrowRight, ArrowRightLeft, BookOpen, Boxes, Building2,
  CalendarDays, ClipboardCheck, Clock3, FileBarChart, FolderPlus,
  PackageCheck, PackageOpen, RotateCcw, ShieldAlert, UserCog, Users, Wrench
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../config/apis";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
    <section className={`rounded-sm border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#31232e]">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
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
        <div key={label} className="rounded-sm bg-gray-50 p-4 border border-gray-100 transition-all hover:border-gray-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#4f3448]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function timeAgo(dateString) {
  if (!dateString) return '';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

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
        else setError(result.error);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-slate-500">Loading dashboard...</div>;
  if (error) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-red-500">Error: {error}</div>;

  const { assets = [], allocations = [], transfers = [], bookingsData = [], maintenanceRequests = [], auditCycles = [], overdueData = [], employeesData = [], activities = [] } = data || {};
  
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
    { label: "Open Audits", value: openAudits.length, Icon: ClipboardCheck, tone: "bg-orange-50 text-orange-700" },
  ];

  const statusColors = { Available: "bg-emerald-500", Allocated: "bg-blue-500", Reserved: "bg-violet-500", "Under Maintenance": "bg-amber-500", Lost: "bg-red-500", Retired: "bg-slate-500", Disposed: "bg-gray-400" };
  const assetStatuses = Object.entries(statusColors).map(([status, color]) => [status, countStatus(status), color]);
  
  const departmentMap = activeAllocations.reduce((result, item) => ({ ...result, [item.department || "Unassigned"]: (result[item.department || "Unassigned"] || 0) + 1 }), {});
  const chartData = Object.entries(departmentMap).map(([name, count]) => ({ name, count }));

  const pendingActions = [
    ["Transfer Requests", transfers.filter((item) => item.status === "Requested").length, ArrowRightLeft, "/admin/allocations-transfers"],
    ["Maintenance Requests", maintenanceRequests.filter((item) => item.status === "Pending").length, Wrench, "/admin/maintenance"],
    ["Return Requests", activeAllocations.filter((item) => item.expectedReturn).length, RotateCcw, "/admin/allocations-transfers"],
    ["Audit Discrepancies", auditFlags.length, ShieldAlert, "/admin/audits"],
    ["Overdue Returns", overdueData.length, Clock3, "/admin/allocations-transfers"],
    ["Inactive Records", employeesData.filter((item) => item.status === "Inactive").length, UserCog, "/admin/organization-setup"],
  ];
  
  const maintenance = [
    ["Raised This Month", maintenanceRequests.length], ["Pending", maintenanceRequests.filter((item) => item.status === "Pending").length], ["In Progress", maintenanceRequests.filter((item) => item.status === "In Progress").length],
    ["Resolved", maintenanceRequests.filter((item) => item.status === "Resolved").length], ["Critical", maintenanceRequests.filter((item) => item.priority === "Critical" && item.status !== "Resolved").length], ["Frequent Repairs", assets.filter((item) => (item.maintenanceHistory || []).length > 2).length],
  ];

  const booking = [
    ["Active Bookings", activeBookings], 
    ["Upcoming Today", bookingsData.filter((item) => item.date === new Date().toISOString().slice(0, 10) && item.status !== "Cancelled").length],
    ["Most Used Resource", bookingsData.length > 0 ? Object.entries(bookingsData.reduce((result, item) => ({ ...result, [item.resource]: (result[item.resource] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0]?.[0] : "None"],
    ["Cancelled This Month", bookingsData.filter((item) => item.status === "Cancelled").length], 
    ["Total Bookings", bookingsData.length],
  ];
  
  const audit = [
    ["Open Audit Cycles", openAudits.length], ["Upcoming Audits", auditCycles.filter((item) => item.status === "Open").length], ["Assets Verified", auditCycles.flatMap((item) => item.items || []).filter((item) => item.result === "Verified").length],
    ["Missing Assets", auditFlags.filter((item) => item.result === "Missing").length], ["Damaged Assets", auditFlags.filter((item) => item.result === "Damaged").length], ["Open Discrepancies", auditFlags.length],
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <section className="grid grid-cols-4 gap-4">
        {kpis.map(({ label, value, Icon, tone }) => (
          <div key={label} className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[#31232e]">{value}</p>
              </div>
              <div className={`rounded-sm p-2.5 ${tone}`}><Icon size={21} /></div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-5 gap-6">
        <Section className="col-span-3" title="Asset Status Overview" description="Current distribution across the asset lifecycle.">
          <div className="space-y-4 pt-2">
            {assetStatuses.map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="font-semibold text-[#31232e]">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${value ? Math.max(8, (value / Math.max(1, totalAssets)) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section className="col-span-2" title="Allocations by Department" description="Visual breakdown of asset distribution.">
          {chartData.length > 0 ? (
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#4f3448" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm font-medium text-gray-500">No active allocations yet.</div>
          )}
        </Section>
      </div>

      <Section title="Pending Actions & Alerts" description="Items that currently require administrator attention.">
        <div className="grid grid-cols-3 gap-4">
          {pendingActions.map(([label, count, Icon, path]) => (
            <div key={label} className="flex items-center justify-between rounded-sm border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-[#4f3448] hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="rounded-sm bg-amber-50 p-2 text-amber-700"><Icon size={18} /></div>
                <div>
                  <p className="text-xl font-bold text-[#31232e]">{count}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mt-0.5">{label}</p>
                </div>
              </div>
              <Link className="inline-flex items-center gap-1 text-sm font-medium text-[#4f3448] hover:underline" to={path}>
                Review <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-6">
        <Section title="Maintenance Overview" description="Maintenance workload and resolution health." action={<Wrench className="text-[#4f3448]" size={21} />}>
          <MetricList items={maintenance} />
        </Section>
        <Section title="Resource Booking Overview" description="Shared resource usage and booking trends." action={<BookOpen className="text-[#4f3448]" size={21} />}>
          <MetricList items={booking} />
        </Section>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <Section className="col-span-3" title="Recent Activity Logs" description="Real-time actions recorded across AssetFlow." action={<Link className="text-sm font-medium text-[#4f3448] hover:underline" to="/notifications">View all logs</Link>}>
          <div className="divide-y divide-slate-100">
            {activities.length > 0 ? activities.map((log, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_150px_120px_100px] items-center gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-sm bg-gray-50 border border-gray-100 p-2 text-[#4f3448]"><Activity size={16} /></div>
                  <span className="text-sm font-medium text-slate-700">{log.action}</span>
                </div>
                <span className="text-sm text-slate-500">{log.user_name || 'System'}</span>
                <span className="text-sm text-slate-500">{timeAgo(log.created_at)}</span>
                <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{log.module}</span>
              </div>
            )) : (
              <div className="py-8 text-sm font-medium text-gray-500 text-center">No recent activity found in the logs.</div>
            )}
          </div>
        </Section>

        <div className="col-span-2 space-y-6">
          <Section title="Audit Overview" description="Verification progress and unresolved audit findings." action={<ClipboardCheck className="text-[#4f3448]" size={21} />}>
            <MetricList items={audit} />
          </Section>

          <Section title="Quick Actions" description="Common shortcuts.">
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map(([label, path, Icon]) => (
                <Link key={label} className="group flex items-center justify-between rounded-sm border border-gray-200 bg-gray-50 p-3 shadow-sm transition-colors hover:border-[#4f3448] hover:bg-white" to={path}>
                  <span className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <Icon className="text-[#4f3448]" size={17} /> {label}
                  </span>
                  <ArrowRight className="text-slate-400 group-hover:text-[#4f3448]" size={15} />
                </Link>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
