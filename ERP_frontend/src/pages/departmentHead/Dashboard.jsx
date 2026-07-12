import { useEffect, useMemo, useState } from "react";
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
import { API_ENDPOINTS } from "../../config/apis";

export default function Dashboard() {
  const { user } = useAuth();
  const department = user?.department || "Unassigned";
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("assetflow_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [assetsRes, employeesRes, allocationsRes, transfersRes, bookingsRes, maintenanceRes, auditsRes] = await Promise.all([
          fetch(API_ENDPOINTS.ASSETS.GET_ALL, { headers }),
          fetch(API_ENDPOINTS.ORGANIZATION.EMPLOYEES, { headers }),
          fetch(API_ENDPOINTS.ALLOCATIONS.BASE, { headers }),
          fetch(API_ENDPOINTS.ALLOCATIONS.TRANSFERS, { headers }),
          fetch(API_ENDPOINTS.BOOKINGS.BASE, { headers }),
          fetch(API_ENDPOINTS.MAINTENANCE.REQUESTS, { headers }),
          fetch(API_ENDPOINTS.AUDITS.BASE, { headers }),
        ]);

        const [assetsJson, employeesJson, allocationsJson, transfersJson, bookingsJson, maintenanceJson, auditsJson] = await Promise.all([
          assetsRes.json(),
          employeesRes.json(),
          allocationsRes.json(),
          transfersRes.json(),
          bookingsRes.json(),
          maintenanceRes.json(),
          auditsRes.json(),
        ]);

        if (!assetsJson.success) throw new Error(assetsJson.error || "Failed to load assets");
        if (!employeesJson.success) throw new Error(employeesJson.error || "Failed to load employees");
        if (!allocationsJson.success) throw new Error(allocationsJson.error || "Failed to load allocations");
        if (!transfersJson.success) throw new Error(transfersJson.error || "Failed to load transfers");
        if (!bookingsJson.success) throw new Error(bookingsJson.error || "Failed to load bookings");
        if (!maintenanceJson.success) throw new Error(maintenanceJson.error || "Failed to load maintenance requests");
        if (!auditsJson.success) throw new Error(auditsJson.error || "Failed to load audit assignments");

        setAssets(
          assetsJson.data.map((item) => ({
            ...item,
            tag: item.asset_tag,
            name: item.name,
            category: item.category_name || "Uncategorized",
            location: item.department_name || "Not set",
            status: item.status || "Unknown",
            holder:
              item.first_name || item.last_name
                ? `${item.first_name || ""} ${item.last_name || ""}`.trim()
                : item.department_name || "Unassigned",
          })),
        );

        setEmployees(
          employeesJson.data
            .filter((item) => item.department_name === department)
            .map((item) => ({
              ...item,
              name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
            })),
        );

        setAllocations(
          allocationsJson.data.filter((item) => item.department_name === department),
        );

        setTransfers(
          transfersJson.data.map((item) => ({
            ...item,
            status: item.status || "Requested",
          })),
        );

        setBookings(
          bookingsJson.data.filter((item) => item.department_name === department),
        );

        setMaintenance(
          maintenanceJson.data.map((item) => ({
            id: item.request_id,
            assetName: item.asset_name,
            assetTag: item.asset_tag,
            issue: item.issue_description,
            priority: item.priority,
            technician: item.technician_name || "",
            status: item.status,
            raisedOn: item.created_at,
            department_name: item.department_name,
            history: item.history || [],
          })),
        );

        setAudits(
          auditsJson.data
            .filter(
              (item) =>
                item.department_name === department ||
                item.auditor_name === user.fullName ||
                item.auditor_name === user.email,
            )
            .map((item) => ({
              ...item,
              scopeType: item.department_name ? "Department" : "Personal",
              scopeValue: item.department_name || item.auditor_name || "",
              auditors: item.auditor_name ? [item.auditor_name] : [],
            })),
        );
      } catch (err) {
        setError(err.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [department, user.fullName, user.email]);

  const tags = useMemo(
    () => new Set(assets.map((item) => item.tag)),
    [assets],
  );
  const departmentMaintenance = useMemo(
    () => maintenance.filter((item) => tags.has(item.assetTag)),
    [maintenance, tags],
  );
  const requestedTransfers = useMemo(
    () => transfers.filter((item) => item.status === "Requested"),
    [transfers],
  );
  const activeAllocations = useMemo(
    () => allocations,
    [allocations],
  );
  const total = Math.max(1, assets.length);
  const categories = useMemo(
    () =>
      assets.reduce(
        (result, item) => ({
          ...result,
          [item.category || "Uncategorized"]:
            (result[item.category || "Uncategorized"] || 0) + 1,
        }),
        {},
      ),
    [assets],
  );
  const recent = assets.slice(-5).reverse();

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  }

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
          value: activeAllocations.length,
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
          value: 0,
          Icon: PackagePlus,
          detail: "No request endpoint available",
        },
        {
          label: "Transfer Requests",
          value: requestedTransfers.length,
          Icon: ArrowRightLeft,
          detail: "Awaiting your decision",
        },
        {
          label: "Maintenance Cases",
          value: departmentMaintenance.filter(
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
            label: "Maintenance Resolved",
            value: departmentMaintenance.filter((item) => item.status === "Resolved").length,
            Icon: Wrench,
          },
          {
            label: "Assets Returned",
            value: allocations.filter((item) => item.status === "Returned").length,
            Icon: RotateCcw,
          },
          {
            label: "Resource Bookings",
            value: bookings.filter((item) => item.status !== "Cancelled").length,
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
            label: "Transfer Requests",
            value: requestedTransfers.length,
            Icon: ArrowRightLeft,
            path: "/department-head/allocations-transfers",
          },
          {
            label: "Maintenance Cases",
            value: departmentMaintenance.filter(
              (item) => !["Resolved", "Rejected"].includes(item.status),
            ).length,
            Icon: Wrench,
            path: "/department-head/maintenance",
          },
          {
            label: "Department Bookings",
            value: bookings.filter((item) => item.status !== "Cancelled").length,
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
            value: employees.filter((item) => item.status === "Inactive").length,
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
        ...requestedTransfers.slice(-1).map((item) => ({
          text: `${item.id} is ${item.status}`,
          time: item.created_at || "Recently",
          Icon: ArrowRightLeft,
        })),
        ...departmentMaintenance.slice(-1).map((item) => ({
          text: `${item.id} is ${item.status}`,
          time: item.raisedOn || "Recently",
          Icon: Wrench,
        })),
        ...audits.slice(-1).map((item) => ({
          text: `${item.name} is ${item.status}`,
          time: item.created_at || "Recently",
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
