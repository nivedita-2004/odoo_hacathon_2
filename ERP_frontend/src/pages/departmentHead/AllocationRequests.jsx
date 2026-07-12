import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  PackagePlus,
  Search,
  XCircle,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { API_ENDPOINTS } from "../../config/apis";

export default function AllocationRequests() {
  const { user } = useAuth();
  const department = user?.department || "Unassigned";
  const [requests, setRequests] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [tab, setTab] = useState("allocation");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("assetflow_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [allocRes, transferRes, assetRes, reqRes] = await Promise.all([
          fetch(API_ENDPOINTS.ALLOCATIONS.BASE, { headers }),
          fetch(API_ENDPOINTS.ALLOCATIONS.TRANSFERS, { headers }),
          fetch(API_ENDPOINTS.ASSETS.GET_ALL, { headers }),
          fetch(API_ENDPOINTS.ALLOCATIONS.REQUESTS, { headers }),
        ]);
        const [allocJson, transferJson, assetJson, reqJson] = await Promise.all([
          allocRes.json(),
          transferRes.json(),
          assetRes.json(),
          reqRes.json(),
        ]);

        if (!allocJson.success) throw new Error(allocJson.error || "Failed to load allocations");
        if (!transferJson.success) throw new Error(transferJson.error || "Failed to load transfers");
        if (!assetJson.success) throw new Error(assetJson.error || "Failed to load assets");
        if (!reqJson.success) throw new Error(reqJson.error || "Failed to load allocation requests");

        setRequests(
          reqJson.data.map((item) => ({
            id: item.id,
            employee: item.first_name || item.last_name ? `${item.first_name || ""} ${item.last_name || ""}`.trim() : "Unknown",
            department: item.department_name || "Unassigned",
            assetType: item.category_name || "Unknown",
            preferredAssetTag: item.preferred_asset_tag || "",
            reason: item.reason || "",
            requestedOn: item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN") : "",
            status: item.status || "PENDING",
          })),
        );

        setTransfers(
          transferJson.data.map((item) => ({
            id: item.id,
            assetName: item.asset_name,
            assetTag: item.asset_tag,
            from: item.from_department || "Unknown",
            to: item.to_department || "Unknown",
            reason: item.reason,
            status: item.status || "Requested",
          })),
        );

        setAllocations(
          allocJson.data.filter((item) => item.department_name === department),
        );

        setAssets(assetJson.data);
      } catch (err) {
        setError(err.message || "Unable to load allocation requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [department]);
  const scopedRequests = requests.filter(
    (item) =>
      item.department === department &&
      [item.id, item.employee, item.assetType, item.reason].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  const scopedTransfers = transfers.filter(
    (item) =>
      (item.from === department || item.to === department) &&
      [item.id, item.assetName, item.from, item.to].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  const decideAllocation = async (request, decision) => {
    try {
      const token = localStorage.getItem("assetflow_token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      if (decision === "Rejected") {
        const res = await fetch(API_ENDPOINTS.ALLOCATIONS.REJECT_REQUEST(request.id), { method: "PUT", headers });
        if (!res.ok) throw new Error("Failed to reject request");
        setRequests(requests.map(r => r.id === request.id ? { ...r, status: "REJECTED" } : r));
        return;
      }

      const asset =
        assets.find((item) => item.tag === request.preferredAssetTag && item.status === "Available") ||
        assets.find((item) => item.department_name === department && item.status === "Available") ||
        assets.find((item) => item.status === "Available");

      if (!asset) {
        alert("No available assets to allocate.");
        return;
      }

      const res = await fetch(API_ENDPOINTS.ALLOCATIONS.APPROVE_REQUEST(request.id), {
        method: "PUT",
        headers,
        body: JSON.stringify({ allocated_asset_id: asset.id })
      });
      
      if (!res.ok) throw new Error("Failed to approve request");
      
      setRequests(requests.map(r => r.id === request.id ? { ...r, status: "APPROVED" } : r));
      setAssets(assets.map(a => a.id === asset.id ? { ...a, status: "Allocated" } : a));
    } catch (err) {
      alert(err.message);
    }
  };

  const decideTransfer = async (request, decision) => {
    try {
      const token = localStorage.getItem("assetflow_token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const endpoint = decision === "Approved" 
        ? API_ENDPOINTS.ALLOCATIONS.APPROVE_TRANSFER(request.id)
        : API_ENDPOINTS.ALLOCATIONS.REJECT_TRANSFER(request.id);

      const res = await fetch(endpoint, { method: "PUT", headers });
      if (!res.ok) throw new Error(`Failed to ${decision.toLowerCase()} transfer`);

      setTransfers(transfers.map(t => t.id === request.id ? { ...t, status: decision === "Approved" ? "APPROVED" : "REJECTED" } : t));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-sm font-medium text-[#7a6475]">{department}</p>
        <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
          Allocation & Transfer Requests
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Approve or reject requests belonging only to your department.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          [
            "Pending Allocations",
            scopedRequests.filter((item) => item.status === "PENDING").length,
            PackagePlus,
          ],
          [
            "Approved Allocations",
            scopedRequests.filter((item) => item.status === "APPROVED")
              .length,
            Check,
          ],
          [
            "Pending Transfers",
            scopedTransfers.filter((item) => item.status === "Requested" || item.status === "PENDING")
              .length,
            ArrowRightLeft,
          ],
          [
            "Rejected Requests",
            [...scopedRequests, ...scopedTransfers].filter(
              (item) => item.status === "Rejected" || item.status === "REJECTED",
            ).length,
            XCircle,
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
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#e6dee4] bg-white p-2">
        <button
          className={`rounded-lg p-3 text-sm font-semibold ${tab === "allocation" ? "bg-[#4f3448] text-white" : "text-slate-600"}`}
          onClick={() => setTab("allocation")}
        >
          Allocation Requests
        </button>
        <button
          className={`rounded-lg p-3 text-sm font-semibold ${tab === "transfer" ? "bg-[#4f3448] text-white" : "text-slate-600"}`}
          onClick={() => setTab("transfer")}
        >
          Transfer Requests
        </button>
      </div>
      <section className="rounded-xl border border-[#e6dee4] bg-white shadow-sm">
        <div className="border-b p-5">
          <div className="relative max-w-lg">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search department requests..."
            />
          </div>
        </div>
        {tab === "allocation" ? (
          <RequestTable rows={scopedRequests} decide={decideAllocation} />
        ) : (
          <TransferTable rows={scopedTransfers} decide={decideTransfer} />
        )}
      </section>
    </div>
  );
}
function RequestTable({ rows, decide }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
            {[
              "Request",
              "Employee",
              "Asset Type",
              "Preferred Asset",
              "Reason",
              "Status",
              "Actions",
            ].map((item) => (
              <th key={item} className="px-4 py-3">
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="px-4 py-4 font-semibold text-[#4f3448]">
                {item.id}
                <small>{item.requestedOn}</small>
              </td>
              <td className="px-4 py-4">{item.employee}</td>
              <td className="px-4 py-4">{item.assetType}</td>
              <td className="px-4 py-4">
                {item.preferredAssetTag || "Any available"}
              </td>
              <td className="max-w-72 px-4 py-4 text-slate-600">
                {item.reason}
              </td>
              <td className="px-4 py-4">
                <Status value={item.status} />
              </td>
              <td className="px-4 py-4">
                {item.status === "PENDING" && (
                  <>
                    <button
                      className="mr-3 font-medium text-emerald-700"
                      onClick={() => decide(item, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="font-medium text-red-700"
                      onClick={() => decide(item, "Rejected")}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function TransferTable({ rows, decide }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-left text-sm">
        <thead>
          <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
            {[
              "Request",
              "Asset",
              "From",
              "To",
              "Reason",
              "Status",
              "Actions",
            ].map((item) => (
              <th key={item} className="px-4 py-3">
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="px-4 py-4 font-semibold text-[#4f3448]">
                {item.id}
              </td>
              <td className="px-4 py-4">
                {item.assetName}
                <small>{item.assetTag}</small>
              </td>
              <td className="px-4 py-4">{item.from}</td>
              <td className="px-4 py-4">{item.to}</td>
              <td className="px-4 py-4">{item.reason}</td>
              <td className="px-4 py-4">
                <Status value={item.status} />
              </td>
              <td className="px-4 py-4">
                {(item.status === "Requested" || item.status === "PENDING") && (
                  <>
                    <button
                      className="mr-3 font-medium text-emerald-700"
                      onClick={() => decide(item, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="font-medium text-red-700"
                      onClick={() => decide(item, "Rejected")}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Status({ value }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value.toUpperCase() === "APPROVED" ? "bg-emerald-50 text-emerald-700" : value.toUpperCase() === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
    >
      {value}
    </span>
  );
}
