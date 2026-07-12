import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  PackagePlus,
  Search,
  XCircle,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

const read = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};
const initialRequests = [
  {
    id: "AR-0221",
    employee: "Priya Sharma",
    department: "Information Technology",
    assetType: "Laptop",
    preferredAssetTag: "AF-0002",
    reason: "Replacement device for client project",
    requestedOn: "11 Jul 2026",
    status: "Pending",
  },
  {
    id: "AR-0222",
    employee: "Aman Gupta",
    department: "Operations",
    assetType: "Projector",
    preferredAssetTag: "",
    reason: "Weekly operations review",
    requestedOn: "12 Jul 2026",
    status: "Pending",
  },
];

export default function AllocationRequests() {
  const { user } = useAuth();
  const department = user?.department || "Unassigned";
  const [requests, setRequests] = useState(() =>
    read("assetflow_allocation_requests", initialRequests),
  );
  const [transfers, setTransfers] = useState(() => read("assetflow_transfers"));
  const [allocations, setAllocations] = useState(() =>
    read("assetflow_allocations"),
  );
  const [assets, setAssets] = useState(() => read("assetflow_assets"));
  const [tab, setTab] = useState("allocation");
  const [search, setSearch] = useState("");
  useEffect(() => {
    localStorage.setItem(
      "assetflow_allocation_requests",
      JSON.stringify(requests),
    );
  }, [requests]);
  useEffect(() => {
    localStorage.setItem("assetflow_transfers", JSON.stringify(transfers));
  }, [transfers]);
  useEffect(() => {
    localStorage.setItem("assetflow_allocations", JSON.stringify(allocations));
  }, [allocations]);
  useEffect(() => {
    localStorage.setItem("assetflow_assets", JSON.stringify(assets));
  }, [assets]);
  const scopedRequests = requests.filter(
    (item) =>
      item.department === department &&
      [item.id, item.employee, item.assetType, item.reason].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  const scopedTransfers = transfers.filter(
    (item) =>
      item.department === department &&
      [item.id, item.assetName, item.from, item.to].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  const decideAllocation = (request, decision) => {
    if (decision === "Rejected")
      return setRequests(
        requests.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: "Rejected",
                decidedBy: user.fullName || user.email,
              }
            : item,
        ),
      );
    const asset =
      assets.find(
        (item) =>
          item.tag === request.preferredAssetTag && item.status === "Available",
      ) ||
      assets.find(
        (item) => item.department === department && item.status === "Available",
      );
    if (!asset)
      return setRequests(
        requests.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: "Approved - Awaiting Available Asset",
                decidedBy: user.fullName || user.email,
              }
            : item,
        ),
      );
    const allocation = {
      id: `AL-${String(200 + allocations.length).padStart(4, "0")}`,
      assetTag: asset.tag,
      assetName: asset.name,
      holder: request.employee,
      holderType: "Employee",
      department,
      allocatedOn: new Date().toISOString().slice(0, 10),
      expectedReturn: "",
      status: "Active",
      history: [`Approved and allocated by ${user.fullName || user.email}`],
    };
    setAllocations([...allocations, allocation]);
    setAssets(
      assets.map((item) =>
        item.tag === asset.tag
          ? {
              ...item,
              status: "Allocated",
              holder: request.employee,
              department,
              allocationHistory: [
                ...(item.allocationHistory || []),
                {
                  event: `Allocated to ${request.employee}`,
                  date: new Date().toLocaleDateString("en-IN"),
                  detail: `Approved by Department Head`,
                },
              ],
            }
          : item,
      ),
    );
    setRequests(
      requests.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: "Approved",
              allocatedAsset: asset.tag,
              decidedBy: user.fullName || user.email,
            }
          : item,
      ),
    );
  };
  const decideTransfer = (request, decision) => {
    setTransfers(
      transfers.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: decision,
              decidedBy: user.fullName || user.email,
            }
          : item,
      ),
    );
    if (decision === "Approved") {
      setAllocations(
        allocations.map((item) =>
          item.assetTag === request.assetTag && item.status === "Active"
            ? {
                ...item,
                holder: request.to,
                history: [
                  ...item.history,
                  `Department Head approved transfer from ${request.from} to ${request.to}`,
                ],
              }
            : item,
        ),
      );
      setAssets(
        assets.map((item) =>
          item.tag === request.assetTag
            ? {
                ...item,
                holder: request.to,
                allocationHistory: [
                  ...(item.allocationHistory || []),
                  {
                    event: `Transferred to ${request.to}`,
                    date: new Date().toLocaleDateString("en-IN"),
                    detail: `Approved by Department Head`,
                  },
                ],
              }
            : item,
        ),
      );
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
            scopedRequests.filter((item) => item.status === "Pending").length,
            PackagePlus,
          ],
          [
            "Approved Allocations",
            scopedRequests.filter((item) => item.status.startsWith("Approved"))
              .length,
            Check,
          ],
          [
            "Pending Transfers",
            scopedTransfers.filter((item) => item.status === "Requested")
              .length,
            ArrowRightLeft,
          ],
          [
            "Rejected Requests",
            [...scopedRequests, ...scopedTransfers].filter(
              (item) => item.status === "Rejected",
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
                {item.status === "Pending" && (
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
                {item.status === "Requested" && (
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
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value.startsWith("Approved") ? "bg-emerald-50 text-emerald-700" : value === "Rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
    >
      {value}
    </span>
  );
}
