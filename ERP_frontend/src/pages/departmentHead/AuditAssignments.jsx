import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Eye,
  FileWarning,
  Lock,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

export default function AuditAssignments() {
  const { user } = useAuth();
  const department = user?.department || "Unassigned";
  const [cycles, setCycles] = useState(() => read("assetflow_audit_cycles"));
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    localStorage.setItem("assetflow_audit_cycles", JSON.stringify(cycles));
  }, [cycles]);
  const assigned = cycles
    .filter(
      (cycle) =>
        (cycle.scopeType === "Department" && cycle.scopeValue === department) ||
        cycle.auditors?.some(
          (name) => name === user.fullName || name === user.email,
        ),
    )
    .filter((cycle) =>
      [cycle.id, cycle.name, cycle.scopeValue].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  const selected = cycles.find((item) => item.id === selectedId);
  const update = (assetTag, field, value) => {
    if (selected.status === "Closed") return;
    setCycles(
      cycles.map((cycle) =>
        cycle.id === selected.id
          ? {
              ...cycle,
              status: "In Progress",
              items: cycle.items.map((item) =>
                item.assetTag === assetTag
                  ? {
                      ...item,
                      [field]: value,
                      checkedBy:
                        field === "result"
                          ? user.fullName || user.email
                          : item.checkedBy,
                      checkedOn:
                        field === "result"
                          ? new Date().toLocaleDateString("en-IN")
                          : item.checkedOn,
                    }
                  : item,
              ),
              history:
                field === "result"
                  ? [
                      ...cycle.history,
                      {
                        event: `${assetTag} marked ${value}`,
                        date: new Date().toLocaleDateString("en-IN"),
                        detail: `Verified by ${user.fullName || user.email}`,
                      },
                    ]
                  : cycle.history,
            }
          : cycle,
      ),
    );
  };
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-sm font-medium text-[#7a6475]">{department}</p>
        <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
          Assigned Asset Audits
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Perform verification only for audit cycles assigned to you or your
          department.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          ["Assigned Cycles", assigned.length, ClipboardCheck],
          [
            "Pending Assets",
            assigned
              .flatMap((item) => item.items || [])
              .filter((item) => item.result === "Pending").length,
            Eye,
          ],
          [
            "Verified",
            assigned
              .flatMap((item) => item.items || [])
              .filter((item) => item.result === "Verified").length,
            ShieldCheck,
          ],
          [
            "Discrepancies",
            assigned
              .flatMap((item) => item.items || [])
              .filter((item) => ["Missing", "Damaged"].includes(item.result))
              .length,
            FileWarning,
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
              placeholder="Search assigned audit cycles..."
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
                {[
                  "Cycle",
                  "Scope",
                  "Date Range",
                  "Progress",
                  "Discrepancies",
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
              {assigned.map((cycle) => {
                const checked = cycle.items.filter(
                  (item) => item.result !== "Pending",
                ).length;
                const flags = cycle.items.filter((item) =>
                  ["Missing", "Damaged"].includes(item.result),
                ).length;
                return (
                  <tr key={cycle.id} className="border-b">
                    <td className="px-4 py-4 font-semibold text-[#4f3448]">
                      {cycle.id}
                      <small>{cycle.name}</small>
                    </td>
                    <td className="px-4 py-4">{cycle.scopeValue}</td>
                    <td className="px-4 py-4">
                      {cycle.startDate}–{cycle.endDate}
                    </td>
                    <td className="px-4 py-4">
                      {checked}/{cycle.items.length}
                    </td>
                    <td className="px-4 py-4 text-red-700">{flags}</td>
                    <td className="px-4 py-4">{cycle.status}</td>
                    <td className="px-4 py-4">
                      <button
                        className="inline-flex items-center gap-1 font-medium text-[#4f3448]"
                        onClick={() => setSelectedId(cycle.id)}
                      >
                        <Eye size={15} />
                        {cycle.status === "Closed" ? "View" : "Perform Audit"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {selected && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/25">
          <div className="h-full w-[850px] overflow-y-auto bg-white p-6">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-[#4f3448]">{selected.id}</p>
                <h2 className="text-xl font-semibold">{selected.name}</h2>
              </div>
              <button onClick={() => setSelectedId(null)}>
                <X size={19} />
              </button>
            </div>
            {selected.status === "Closed" && (
              <p className="mt-5 flex gap-2 rounded-lg bg-slate-100 p-3 text-sm">
                <Lock size={16} />
                Closed audit is read-only.
              </p>
            )}
            <div className="mt-6 space-y-3">
              {selected.items.map((item) => (
                <div
                  key={item.assetTag}
                  className="rounded-xl border border-[#e6dee4] p-4"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{item.assetName}</p>
                      <p className="text-xs text-slate-500">
                        {item.assetTag} · {item.location}
                      </p>
                    </div>
                    <select
                      disabled={selected.status === "Closed"}
                      className="rounded-lg border px-3 py-2 text-sm"
                      value={item.result}
                      onChange={(event) =>
                        update(item.assetTag, "result", event.target.value)
                      }
                    >
                      <option>Pending</option>
                      <option>Verified</option>
                      <option>Missing</option>
                      <option>Damaged</option>
                    </select>
                  </div>
                  <input
                    disabled={selected.status === "Closed"}
                    className="mt-3 w-full rounded-lg border border-[#ddd3da] px-3 py-2 text-sm"
                    value={item.notes}
                    onChange={(event) =>
                      update(item.assetTag, "notes", event.target.value)
                    }
                    placeholder="Auditor notes..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
