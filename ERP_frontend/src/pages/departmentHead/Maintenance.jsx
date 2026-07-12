import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Search,
  Wrench,
  X,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { API_ENDPOINTS } from "../../config/apis";

export default function Maintenance() {
  const { user } = useAuth();
  const department = user?.department || "Unassigned";
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("assetflow_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [assetsRes, requestsRes] = await Promise.all([
          fetch(API_ENDPOINTS.ASSETS.GET_ALL, { headers }),
          fetch(API_ENDPOINTS.MAINTENANCE.REQUESTS, { headers }),
        ]);

        const [assetsJson, requestsJson] = await Promise.all([
          assetsRes.json(),
          requestsRes.json(),
        ]);

        if (!assetsJson.success) throw new Error(assetsJson.error || "Failed to load assets");
        if (!requestsJson.success) throw new Error(requestsJson.error || "Failed to load maintenance requests");

        setAssets(assetsJson.data);
        setRequests(
          requestsJson.data.map((item) => ({
            id: item.request_id,
            assetName: item.asset_name,
            assetTag: item.asset_tag,
            issue: item.issue_description,
            priority: item.priority,
            technician: item.technician_name || "",
            status: item.status,
            history: item.history || [],
            raisedOn: item.created_at,
          })),
        );
      } catch (err) {
        setError(err.message || "Unable to load maintenance data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const departmentAssetTags = useMemo(
    () => new Set(assets.filter((item) => item.department_name === department).map((item) => item.asset_tag)),
    [assets, department],
  );

  const visibleRequests = useMemo(
    () =>
      requests
        .filter((item) => departmentAssetTags.has(item.assetTag))
        .filter(
          (item) =>
            (filter === "All" || item.status === filter) &&
            [item.id, item.assetName, item.issue, item.technician]
              .filter(Boolean)
              .some((value) =>
                value.toLowerCase().includes(search.toLowerCase()),
              ),
        ),
    [requests, departmentAssetTags, filter, search],
  );

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading department maintenance...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-sm font-medium text-[#7a6475]">{department}</p>
        <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
          Department Maintenance Status
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Track maintenance progress for your department assets. Approval and
          technician control remain with Asset Manager.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          [
            "Open Cases",
            visibleRequests.filter(
              (item) => !["Resolved", "Rejected"].includes(item.status),
            ).length,
            Wrench,
          ],
          [
            "Pending Approval",
            visibleRequests.filter((item) => item.status === "Pending").length,
            Clock3,
          ],
          [
            "High Priority",
            visibleRequests.filter(
              (item) =>
                ["High", "Critical"].includes(item.priority) &&
                item.status !== "Resolved",
            ).length,
            AlertTriangle,
          ],
          [
            "Resolved",
            visibleRequests.filter((item) => item.status === "Resolved").length,
            CheckCircle2,
          ],
        ].map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
              <Icon className="text-[#4f3448]" />
            </div>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-[#e6dee4] bg-white shadow-sm">
        <div className="flex gap-3 border-b p-5">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search department maintenance..."
            />
          </div>
          <select
            className="rounded-lg border border-[#ddd3da] px-3"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            {[
              "All",
              "Pending",
              "Approved",
              "Technician Assigned",
              "In Progress",
              "Resolved",
              "Rejected",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
                {[
                  "Request",
                  "Asset",
                  "Issue",
                  "Priority",
                  "Technician",
                  "Status",
                  "Action",
                ].map((item) => (
                  <th key={item} className="px-4 py-3">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-4 font-semibold text-[#4f3448]">
                    {item.id}
                  </td>
                  <td className="px-4 py-4">
                    {item.assetName}
                    <small>{item.assetTag}</small>
                  </td>
                  <td className="max-w-72 px-4 py-4 text-slate-600">
                    {item.issue}
                  </td>
                  <td className="px-4 py-4">{item.priority}</td>
                  <td className="px-4 py-4">
                    {item.technician || "Not assigned"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-[#f1eaf0] px-2.5 py-1 text-xs font-semibold text-[#4f3448]">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      className="inline-flex items-center gap-1 font-medium text-[#4f3448]"
                      onClick={() => setSelected(item)}
                    >
                      <Eye size={15} />
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {selected && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/25">
          <div className="h-full w-[500px] bg-white p-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">{selected.id} History</h2>
              <button onClick={() => setSelected(null)}>
                <X size={19} />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {selected.history.map((item, index) => (
                <div key={index} className="border-l-2 border-[#d9ccd5] pl-4">
                  <p className="font-medium">{item.event}</p>
                  <p className="text-xs text-slate-500">
                    {item.date} · {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
