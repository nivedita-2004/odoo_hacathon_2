import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Eye,
  FileWarning,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

const fallbackAssets = [
  {
    tag: "AF-0001",
    name: "Dell Latitude 5440",
    category: "Electronics",
    department: "Information Technology",
    location: "IT Store - Floor 2",
    status: "Allocated",
    auditHistory: [],
  },
  {
    tag: "AF-0002",
    name: "Epson EB-X49 Projector",
    category: "Electronics",
    department: "Administration",
    location: "Resource Room A",
    status: "Available",
    auditHistory: [],
  },
  {
    tag: "AF-0003",
    name: "Honda City",
    category: "Vehicles",
    department: "Operations",
    location: "Main Parking",
    status: "Reserved",
    auditHistory: [],
  },
  {
    tag: "AF-0004",
    name: "HP EliteBook 840",
    category: "Electronics",
    department: "Finance",
    location: "Service Center",
    status: "Under Maintenance",
    auditHistory: [],
  },
  {
    tag: "AF-0005",
    name: "Ergonomic Workstation",
    category: "Furniture",
    department: "Human Resources",
    location: "HR - Floor 3",
    status: "Allocated",
    auditHistory: [],
  },
];
const auditors = [
  "Rahul Verma",
  "Priya Sharma",
  "Amit Patel",
  "Neha Kapoor",
  "Ananya Mehta",
];
const today = new Date().toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const createSeedCycle = (assets) => ({
  id: "AUD-0001",
  name: "Q3 IT Asset Verification",
  scopeType: "Department",
  scopeValue: "Information Technology",
  startDate: "2026-07-10",
  endDate: "2026-07-20",
  auditors: ["Rahul Verma", "Priya Sharma"],
  status: "In Progress",
  createdOn: "10 Jul 2026",
  closedOn: "",
  history: [
    {
      event: "Audit cycle created",
      date: "10 Jul 2026",
      detail: "Scope: Information Technology",
    },
    {
      event: "Auditors assigned",
      date: "10 Jul 2026",
      detail: "Rahul Verma, Priya Sharma",
    },
  ],
  items: assets
    .filter((asset) => asset.department === "Information Technology")
    .map((asset) => ({
      assetTag: asset.tag,
      assetName: asset.name,
      category: asset.category,
      department: asset.department,
      location: asset.location,
      result: "Pending",
      notes: "",
      checkedBy: "",
      checkedOn: "",
    })),
});

export default function AuditCycles() {
  const [assets, setAssets] = useState(() =>
    read("assetflow_assets", fallbackAssets),
  );
  const [cycles, setCycles] = useState(() => {
    const saved = read("assetflow_audit_cycles", null);
    return saved || [createSeedCycle(read("assetflow_assets", fallbackAssets))];
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [createForm, setCreateForm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reportCycle, setReportCycle] = useState(null);
  const [closeConfirm, setCloseConfirm] = useState(null);

  useEffect(() => {
    localStorage.setItem("assetflow_audit_cycles", JSON.stringify(cycles));
  }, [cycles]);
  useEffect(() => {
    localStorage.setItem("assetflow_assets", JSON.stringify(assets));
  }, [assets]);

  const visible = useMemo(
    () =>
      cycles.filter(
        (cycle) =>
          (filter === "All" || cycle.status === filter) &&
          [cycle.id, cycle.name, cycle.scopeValue, ...cycle.auditors].some(
            (value) => value.toLowerCase().includes(search.toLowerCase()),
          ),
      ),
    [cycles, filter, search],
  );
  const currentCycle = selected
    ? cycles.find((cycle) => cycle.id === selected)
    : null;
  const departments = [
    ...new Set(assets.map((asset) => asset.department).filter(Boolean)),
  ];
  const locations = [
    ...new Set(assets.map((asset) => asset.location).filter(Boolean)),
  ];

  const createCycle = (event) => {
    event.preventDefault();
    const scoped = assets.filter((asset) =>
      createForm.scopeType === "Department"
        ? asset.department === createForm.scopeValue
        : asset.location === createForm.scopeValue,
    );
    const cycle = {
      ...createForm,
      id: `AUD-${String(cycles.length + 1).padStart(4, "0")}`,
      status: "Open",
      createdOn: today,
      closedOn: "",
      history: [
        {
          event: "Audit cycle created",
          date: today,
          detail: `Scope: ${createForm.scopeType} · ${createForm.scopeValue}`,
        },
        {
          event: "Auditors assigned",
          date: today,
          detail: createForm.auditors.join(", "),
        },
      ],
      items: scoped.map((asset) => ({
        assetTag: asset.tag,
        assetName: asset.name,
        category: asset.category,
        department: asset.department,
        location: asset.location,
        result: "Pending",
        notes: "",
        checkedBy: "",
        checkedOn: "",
      })),
    };
    setCycles([cycle, ...cycles]);
    setCreateForm(null);
    setSelected(cycle.id);
  };

  const updateAuditItem = (assetTag, field, value) => {
    if (currentCycle.status === "Closed") return;
    setCycles(
      cycles.map((cycle) =>
        cycle.id === currentCycle.id
          ? {
              ...cycle,
              status: "In Progress",
              items: cycle.items.map((item) =>
                item.assetTag === assetTag
                  ? {
                      ...item,
                      [field]: value,
                      ...(field === "result" ? { checkedOn: today } : {}),
                    }
                  : item,
              ),
              history:
                field === "result"
                  ? [
                      ...cycle.history,
                      {
                        event: `${assetTag} marked ${value}`,
                        date: today,
                        detail: `Verification result updated`,
                      },
                    ]
                  : cycle.history,
            }
          : cycle,
      ),
    );
  };

  const closeCycle = () => {
    const cycle = cycles.find((item) => item.id === closeConfirm);
    if (cycle.items.some((item) => item.result === "Pending")) return;
    setAssets(
      assets.map((asset) => {
        const result = cycle.items.find((item) => item.assetTag === asset.tag);
        if (!result) return asset;
        const status =
          result.result === "Missing"
            ? "Lost"
            : result.result === "Damaged"
              ? "Under Maintenance"
              : asset.status;
        return {
          ...asset,
          status,
          auditHistory: [
            ...(asset.auditHistory || []),
            {
              cycleId: cycle.id,
              result: result.result,
              notes: result.notes,
              date: today,
            },
          ],
        };
      }),
    );
    setCycles(
      cycles.map((item) =>
        item.id === cycle.id
          ? {
              ...item,
              status: "Closed",
              closedOn: today,
              history: [
                ...item.history,
                {
                  event: "Audit cycle closed",
                  date: today,
                  detail: "Cycle locked. Flagged asset statuses updated.",
                },
              ],
            }
          : item,
      ),
    );
    setCloseConfirm(null);
    setSelected(null);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#7a6475]">
            Structured verification
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
            Asset Audit Cycles
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Create scoped audits, verify every asset and resolve discrepancies
            before closing.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white"
          onClick={() =>
            setCreateForm({
              name: "",
              scopeType: "Department",
              scopeValue: "",
              startDate: "",
              endDate: "",
              auditors: [],
            })
          }
        >
          <Plus size={18} />
          Create Audit Cycle
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          [
            "Open Cycles",
            cycles.filter((item) => item.status !== "Closed").length,
            ClipboardCheck,
          ],
          [
            "Assets Verified",
            cycles
              .flatMap((item) => item.items)
              .filter((item) => item.result === "Verified").length,
            ShieldCheck,
          ],
          [
            "Missing Assets",
            cycles
              .flatMap((item) => item.items)
              .filter((item) => item.result === "Missing").length,
            FileWarning,
          ],
          [
            "Damaged Assets",
            cycles
              .flatMap((item) => item.items)
              .filter((item) => item.result === "Damaged").length,
            AlertTriangle,
          ],
        ].map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[#31232e]">
                  {value}
                </p>
              </div>
              <div className="h-fit rounded-lg bg-[#f1eaf0] p-2.5 text-[#4f3448]">
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-[#e6dee4] bg-white shadow-sm">
        <div className="flex gap-3 border-b border-[#e6dee4] p-5">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3 outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cycle, scope or auditor..."
            />
          </div>
          <select
            className="rounded-lg border border-[#ddd3da] px-3 py-2.5"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            {["All", "Open", "In Progress", "Closed"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead>
              <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
                {[
                  "Cycle",
                  "Scope",
                  "Date Range",
                  "Auditors",
                  "Progress",
                  "Discrepancies",
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
              {visible.map((cycle) => {
                const checked = cycle.items.filter(
                  (item) => item.result !== "Pending",
                ).length;
                const flagged = cycle.items.filter((item) =>
                  ["Missing", "Damaged"].includes(item.result),
                ).length;
                return (
                  <tr key={cycle.id} className="border-b border-slate-100">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#4f3448]">{cycle.id}</p>
                      <p className="text-xs text-slate-500">{cycle.name}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {cycle.scopeType}
                      <p className="text-xs">{cycle.scopeValue}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {cycle.startDate}
                      <p className="text-xs">to {cycle.endDate}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {cycle.auditors.join(", ")}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-[#31232e]">
                        {checked}/{cycle.items.length}
                      </p>
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#4f3448]"
                          style={{
                            width: `${cycle.items.length ? (checked / cycle.items.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          flagged
                            ? "font-semibold text-red-700"
                            : "text-slate-600"
                        }
                      >
                        {flagged}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <CycleStatus value={cycle.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <button
                          className="inline-flex items-center gap-1 font-medium text-[#4f3448] hover:underline"
                          onClick={() => setSelected(cycle.id)}
                        >
                          <Eye size={15} />
                          {cycle.status === "Closed" ? "View" : "Audit"}
                        </button>
                        <button
                          className="font-medium text-amber-700 hover:underline"
                          onClick={() => setReportCycle(cycle)}
                        >
                          Report
                        </button>
                        {cycle.status !== "Closed" && (
                          <button
                            className="inline-flex items-center gap-1 font-medium text-red-700 hover:underline"
                            onClick={() => setCloseConfirm(cycle.id)}
                          >
                            <Lock size={14} />
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {createForm && (
        <CreateModal
          form={createForm}
          setForm={setCreateForm}
          departments={departments}
          locations={locations}
          submit={createCycle}
          close={() => setCreateForm(null)}
        />
      )}
      {currentCycle && (
        <AuditPanel
          cycle={currentCycle}
          update={updateAuditItem}
          close={() => setSelected(null)}
        />
      )}
      {reportCycle && (
        <ReportPanel cycle={reportCycle} close={() => setReportCycle(null)} />
      )}
      {closeConfirm && (
        <CloseModal
          cycle={cycles.find((item) => item.id === closeConfirm)}
          close={() => setCloseConfirm(null)}
          confirm={closeCycle}
        />
      )}
    </div>
  );
}

const input =
  "mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448]";
function CreateModal({ form, setForm, departments, locations, submit, close }) {
  const update = (event) => {
    const next = { ...form, [event.target.name]: event.target.value };
    if (event.target.name === "scopeType") next.scopeValue = "";
    setForm(next);
  };
  const toggleAuditor = (name) =>
    setForm({
      ...form,
      auditors: form.auditors.includes(name)
        ? form.auditors.filter((item) => item !== name)
        : [...form.auditors, name],
    });
  return (
    <Modal title="Create Audit Cycle" close={close}>
      <form onSubmit={submit}>
        <div className="space-y-4">
          <Field label="Cycle Name">
            <input
              required
              className={input}
              name="name"
              value={form.name}
              onChange={update}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Scope Type">
              <select
                className={input}
                name="scopeType"
                value={form.scopeType}
                onChange={update}
              >
                <option>Department</option>
                <option>Location</option>
              </select>
            </Field>
            <Field label={form.scopeType}>
              <select
                required
                className={input}
                name="scopeValue"
                value={form.scopeValue}
                onChange={update}
              >
                <option value="">Select {form.scopeType.toLowerCase()}</option>
                {(form.scopeType === "Department"
                  ? departments
                  : locations
                ).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Start Date">
              <input
                required
                className={input}
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={update}
              />
            </Field>
            <Field label="End Date">
              <input
                required
                min={form.startDate}
                className={input}
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={update}
              />
            </Field>
          </div>
          <Field label="Assign Auditors">
            <div className="mt-2 grid grid-cols-2 gap-2">
              {auditors.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-[#e6dee4] p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.auditors.includes(item)}
                    onChange={() => toggleAuditor(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </Field>
          {form.auditors.length === 0 && (
            <p className="text-xs text-amber-700">
              Select at least one auditor.
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-lg border px-4 py-2.5"
            type="button"
            onClick={close}
          >
            Cancel
          </button>
          <button
            disabled={!form.auditors.length}
            className="rounded-lg bg-[#4f3448] px-4 py-2.5 font-medium text-white disabled:opacity-50"
          >
            Create Cycle
          </button>
        </div>
      </form>
    </Modal>
  );
}
function AuditPanel({ cycle, update, close }) {
  const locked = cycle.status === "Closed";
  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/25">
      <div className="h-full w-[900px] overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex justify-between">
          <div>
            <p className="font-semibold text-[#4f3448]">{cycle.id}</p>
            <h2 className="text-xl font-semibold text-[#31232e]">
              {cycle.name}
            </h2>
            <p className="text-sm text-slate-500">
              {cycle.scopeType}: {cycle.scopeValue} ·{" "}
              {cycle.auditors.join(", ")}
            </p>
          </div>
          <button onClick={close}>
            <X size={19} />
          </button>
        </div>
        {locked && (
          <p className="mt-5 flex items-center gap-2 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
            <Lock size={16} />
            This cycle is closed and locked.
          </p>
        )}
        <div className="mt-6 space-y-3">
          {cycle.items.map((item) => (
            <div
              key={item.assetTag}
              className="rounded-xl border border-[#e6dee4] p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#31232e]">
                    {item.assetName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.assetTag} · {item.category} · {item.location}
                  </p>
                </div>
                <select
                  disabled={locked}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${item.result === "Missing" ? "border-red-200 text-red-700" : item.result === "Damaged" ? "border-amber-200 text-amber-700" : "border-[#ddd3da] text-[#4f3448]"}`}
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
              <div className="mt-3 grid grid-cols-[1fr_220px] gap-3">
                <input
                  disabled={locked}
                  className="rounded-lg border border-[#ddd3da] px-3 py-2 text-sm"
                  value={item.notes}
                  onChange={(event) =>
                    update(item.assetTag, "notes", event.target.value)
                  }
                  placeholder="Verification notes..."
                />
                <select
                  disabled={locked}
                  className="rounded-lg border border-[#ddd3da] px-3 py-2 text-sm"
                  value={item.checkedBy}
                  onChange={(event) =>
                    update(item.assetTag, "checkedBy", event.target.value)
                  }
                >
                  <option value="">Checked by</option>
                  {cycle.auditors.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <h3 className="mt-8 font-semibold text-[#31232e]">Cycle History</h3>
        <div className="mt-3 space-y-3">
          {cycle.history.map((item, index) => (
            <div
              key={`${item.event}-${index}`}
              className="border-l-2 border-[#d9ccd5] pl-4"
            >
              <p className="text-sm font-medium">{item.event}</p>
              <p className="text-xs text-slate-500">
                {item.date} · {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function ReportPanel({ cycle, close }) {
  const flagged = cycle.items.filter((item) =>
    ["Missing", "Damaged"].includes(item.result),
  );
  return (
    <Modal title="Discrepancy Report" close={close}>
      <p className="text-sm text-slate-500">
        Automatically generated for {cycle.id} · {cycle.name}
      </p>
      <div className="mt-5 space-y-3">
        {flagged.map((item) => (
          <div
            key={item.assetTag}
            className="rounded-lg border border-red-100 bg-red-50 p-4"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-red-900">{item.assetName}</p>
                <p className="text-xs text-red-700">
                  {item.assetTag} · {item.location}
                </p>
              </div>
              <span className="h-fit rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-red-700">
                {item.result}
              </span>
            </div>
            <p className="mt-2 text-sm text-red-800">
              {item.notes || "No auditor notes provided."}
            </p>
          </div>
        ))}
        {!flagged.length && (
          <p className="rounded-lg bg-emerald-50 py-10 text-center text-sm text-emerald-700">
            No discrepancies found in this cycle.
          </p>
        )}
      </div>
    </Modal>
  );
}
function CloseModal({ cycle, close, confirm }) {
  const pending = cycle.items.filter(
    (item) => item.result === "Pending",
  ).length;
  return (
    <Modal title="Close Audit Cycle" close={close}>
      <div
        className={`rounded-lg p-4 ${pending ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"}`}
      >
        <p className="font-semibold">
          {pending
            ? `${pending} assets are still pending verification.`
            : "Closing permanently locks this cycle."}
        </p>
        <p className="mt-1 text-sm">
          {pending
            ? "Verify every asset before closing."
            : "Missing assets will become Lost and damaged assets will move to Under Maintenance."}
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button className="rounded-lg border px-4 py-2.5" onClick={close}>
          Cancel
        </button>
        <button
          disabled={pending > 0}
          className="rounded-lg bg-red-700 px-4 py-2.5 font-medium text-white disabled:opacity-40"
          onClick={confirm}
        >
          <Lock className="mr-2 inline" size={16} />
          Close & Lock Cycle
        </button>
      </div>
    </Modal>
  );
}
function Modal({ title, close, children }) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-semibold text-[#31232e]">{title}</h2>
          <button onClick={close}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
function CycleStatus({ value }) {
  const style = {
    Open: "bg-blue-50 text-blue-700",
    "In Progress": "bg-amber-50 text-amber-700",
    Closed: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style[value]}`}
    >
      {value}
    </span>
  );
}
