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
import { API_ENDPOINTS } from "../../config/apis";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AuditCycles() {
  const [audits, setAudits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [createForm, setCreateForm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reportCycle, setReportCycle] = useState(null);
  const [closeConfirm, setCloseConfirm] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("assetflow_token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [auditsRes, auditorsRes, deptsRes] = await Promise.all([
        fetch(API_ENDPOINTS.AUDITS.BASE, { headers }),
        fetch(API_ENDPOINTS.AUDITS.AUDITORS, { headers }),
        fetch(API_ENDPOINTS.ORGANIZATION.DEPARTMENTS, { headers }),
      ]);
      const [aData, auData, dData] = await Promise.all([
        auditsRes.json(),
        auditorsRes.json(),
        deptsRes.json(),
      ]);
      if (aData.success) setAudits(aData.data);
      if (auData.success) setAuditors(auData.data);
      if (dData.success) setDepartments(dData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const visible = useMemo(
    () =>
      audits.filter(
        (cycle) =>
          (filter === "All" || cycle.status === filter || 
           (filter === "Open" && cycle.status === "SCHEDULED") ||
           (filter === "In Progress" && cycle.status === "IN_PROGRESS") ||
           (filter === "Closed" && cycle.status === "COMPLETED")) &&
          [cycle.id, cycle.name, cycle.department_name, cycle.auditor_name].some(
            (value) =>
              value && value.toLowerCase().includes(search.toLowerCase()),
          ),
      ),
    [audits, filter, search],
  );

  const allItems = audits.flatMap((c) => c.items || []);

  const currentCycle = selected
    ? audits.find((cycle) => cycle.id === selected)
    : null;

  const createCycle = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.AUDITS.BASE, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: createForm.name,
          department_id: createForm.department_id || null,
          scheduled_date: createForm.scheduled_date,
          assigned_to: createForm.assigned_to,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateForm(null);
        fetchData();
      } else {
        alert(data.error || "Failed to create audit");
      }
    } catch (err) {
      alert("Error creating audit");
    }
  };

  const verifyAsset = async (auditId, auditAssetId, status, notes) => {
    try {
      const res = await fetch(API_ENDPOINTS.AUDITS.VERIFY(auditId), {
        method: "PUT",
        headers,
        body: JSON.stringify({ audit_asset_id: auditAssetId, status, notes }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to verify");
      }
    } catch (err) {
      alert("Error verifying asset");
    }
  };

  const closeAudit = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.AUDITS.CLOSE(closeConfirm), {
        method: "PUT",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        setCloseConfirm(null);
        setSelected(null);
        fetchData();
      } else {
        alert(data.error || "Failed to close audit");
      }
    } catch (err) {
      alert("Error closing audit");
    }
  };

  const statusLabel = (s) => {
    if (s === "SCHEDULED") return "Open";
    if (s === "IN_PROGRESS") return "In Progress";
    if (s === "COMPLETED") return "Closed";
    return s;
  };

  if (loading && audits.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading audit data...
      </div>
    );
  }

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
              department_id: "",
              scheduled_date: "",
              assigned_to: "",
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
            audits.filter((item) => item.status !== "COMPLETED").length,
            ClipboardCheck,
          ],
          [
            "Assets Verified",
            allItems.filter((item) => item.status === "VERIFIED").length,
            ShieldCheck,
          ],
          [
            "Missing Assets",
            allItems.filter((item) => item.status === "MISSING").length,
            FileWarning,
          ],
          [
            "Damaged Assets",
            allItems.filter((item) => item.status === "DAMAGED").length,
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
                  "Scheduled Date",
                  "Auditor",
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
                const items = cycle.items || [];
                const checked = items.filter(
                  (item) => item.status !== "PENDING",
                ).length;
                const flagged = items.filter((item) =>
                  ["MISSING", "DAMAGED"].includes(item.status),
                ).length;
                return (
                  <tr key={cycle.id} className="border-b border-slate-100">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#4f3448]">
                        {cycle.id.substring(0, 8)}...
                      </p>
                      <p className="text-xs text-slate-500">{cycle.name}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {cycle.department_name || "All Departments"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(cycle.scheduled_date)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {cycle.auditor_name}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-[#31232e]">
                        {checked}/{items.length}
                      </p>
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#4f3448]"
                          style={{
                            width: `${items.length ? (checked / items.length) * 100 : 0}%`,
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
                      <CycleStatus value={statusLabel(cycle.status)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <button
                          className="inline-flex items-center gap-1 font-medium text-[#4f3448] hover:underline"
                          onClick={() => setSelected(cycle.id)}
                        >
                          <Eye size={15} />
                          {cycle.status === "COMPLETED" ? "View" : "Audit"}
                        </button>
                        <button
                          className="font-medium text-amber-700 hover:underline"
                          onClick={() => setReportCycle(cycle)}
                        >
                          Report
                        </button>
                        {cycle.status !== "COMPLETED" && (
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
              {visible.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No audit cycles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {createForm && (
        <CreateModal
          form={createForm}
          setForm={setCreateForm}
          departments={departments}
          auditors={auditors}
          submit={createCycle}
          close={() => setCreateForm(null)}
        />
      )}
      {currentCycle && (
        <AuditPanel
          cycle={currentCycle}
          verify={verifyAsset}
          close={() => setSelected(null)}
        />
      )}
      {reportCycle && (
        <ReportPanel cycle={reportCycle} close={() => setReportCycle(null)} />
      )}
      {closeConfirm && (
        <CloseModal
          cycle={audits.find((item) => item.id === closeConfirm)}
          close={() => setCloseConfirm(null)}
          confirm={closeAudit}
        />
      )}
    </div>
  );
}

const input =
  "mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448]";

function CreateModal({ form, setForm, departments, auditors, submit, close }) {
  const update = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };
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
              placeholder="e.g. Q3 IT Asset Verification"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department (optional)">
              <select
                className={input}
                name="department_id"
                value={form.department_id}
                onChange={update}
              >
                <option value="">All Departments</option>
                {departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Scheduled Date">
              <input
                required
                className={input}
                name="scheduled_date"
                type="date"
                value={form.scheduled_date}
                onChange={update}
              />
            </Field>
          </div>
          <Field label="Assign Auditor">
            <select
              required
              className={input}
              name="assigned_to"
              value={form.assigned_to}
              onChange={update}
            >
              <option value="">Select auditor</option>
              {auditors.map((item) => (
                <option key={item.user_id} value={item.user_id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            className="rounded-lg border px-4 py-2.5"
            type="button"
            onClick={close}
          >
            Cancel
          </button>
          <button className="rounded-lg bg-[#4f3448] px-4 py-2.5 font-medium text-white">
            Create Cycle
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AuditPanel({ cycle, verify, close }) {
  const locked = cycle.status === "COMPLETED";
  const items = cycle.items || [];
  const history = cycle.history || [];
  const [localNotes, setLocalNotes] = useState({});

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/25 backdrop-blur-sm">
      <div className="h-full w-[900px] overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex justify-between">
          <div>
            <p className="font-semibold text-[#4f3448]">
              {cycle.id.substring(0, 8)}...
            </p>
            <h2 className="text-xl font-semibold text-[#31232e]">
              {cycle.name}
            </h2>
            <p className="text-sm text-slate-500">
              {cycle.department_name || "All Departments"} ·{" "}
              {cycle.auditor_name}
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
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#e6dee4] p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#31232e]">
                    {item.asset_name}
                  </p>
                  <p className="text-xs text-slate-500">{item.asset_tag}</p>
                </div>
                <select
                  disabled={locked}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${item.status === "MISSING" ? "border-red-200 text-red-700" : item.status === "DAMAGED" ? "border-amber-200 text-amber-700" : item.status === "VERIFIED" ? "border-emerald-200 text-emerald-700" : "border-[#ddd3da] text-[#4f3448]"}`}
                  value={item.status}
                  onChange={(event) =>
                    verify(
                      cycle.id,
                      item.id,
                      event.target.value,
                      localNotes[item.id] || item.notes || "",
                    )
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="MISSING">Missing</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
              <div className="mt-3">
                <input
                  disabled={locked}
                  className="w-full rounded-lg border border-[#ddd3da] px-3 py-2 text-sm"
                  value={
                    localNotes[item.id] !== undefined
                      ? localNotes[item.id]
                      : item.notes || ""
                  }
                  onChange={(event) =>
                    setLocalNotes({
                      ...localNotes,
                      [item.id]: event.target.value,
                    })
                  }
                  onBlur={() => {
                    if (
                      localNotes[item.id] !== undefined &&
                      localNotes[item.id] !== (item.notes || "") &&
                      item.status !== "PENDING"
                    ) {
                      verify(
                        cycle.id,
                        item.id,
                        item.status,
                        localNotes[item.id],
                      );
                    }
                  }}
                  placeholder="Verification notes..."
                />
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="p-6 text-center text-slate-500">
              No assets in this audit scope.
            </p>
          )}
        </div>
        <h3 className="mt-8 font-semibold text-[#31232e]">Cycle History</h3>
        <div className="mt-3 space-y-3">
          {history.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="border-l-2 border-[#d9ccd5] pl-4"
            >
              <p className="text-sm font-medium">{item.action}</p>
              <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-sm text-slate-500">No history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportPanel({ cycle, close }) {
  const items = cycle.items || [];
  const flagged = items.filter((item) =>
    ["MISSING", "DAMAGED"].includes(item.status),
  );
  return (
    <Modal title="Discrepancy Report" close={close}>
      <p className="text-sm text-slate-500">
        Automatically generated for {cycle.name}
      </p>
      <div className="mt-5 space-y-3">
        {flagged.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-red-100 bg-red-50 p-4"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-red-900">{item.asset_name}</p>
                <p className="text-xs text-red-700">{item.asset_tag}</p>
              </div>
              <span className="h-fit rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-red-700">
                {item.status}
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
  if (!cycle) return null;
  const items = cycle.items || [];
  const pending = items.filter((item) => item.status === "PENDING").length;
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
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6 backdrop-blur-sm">
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
