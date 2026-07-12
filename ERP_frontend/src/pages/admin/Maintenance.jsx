import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  Clock3,
  Eye,
  Plus,
  Search,
  UserCog,
  Wrench,
  X,
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/apis";

const statuses = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
  "Technician Assigned",
  "In Progress",
  "Resolved",
];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  
  const [raiseForm, setRaiseForm] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [resolving, setResolving] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const token = localStorage.getItem("assetflow_token");
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, techRes, assetsRes] = await Promise.all([
        fetch(API_ENDPOINTS.MAINTENANCE.REQUESTS, { headers }),
        fetch(API_ENDPOINTS.MAINTENANCE.ENGINEERS, { headers }),
        fetch(API_ENDPOINTS.ASSETS.GET_ALL, { headers })
      ]);
      const [rData, tData, aData] = await Promise.all([
        reqRes.json(), techRes.json(), assetsRes.json()
      ]);
      
      if (rData.success) setRequests(rData.data);
      if (tData.success) setTechnicians(tData.data);
      if (aData.success) setAssets(aData.data);
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
      requests.filter(
        (item) =>
          (filter === "All" || item.status === filter) &&
          [
            item.request_id,
            item.asset_tag,
            item.asset_name,
            item.issue_description,
            item.raised_by_name,
            item.technician_name,
          ].some((value) => value && value.toLowerCase().includes(search.toLowerCase())),
      ),
    [requests, filter, search],
  );

  const raise = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.MAINTENANCE.REQUESTS, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          asset_id: raiseForm.asset_id,
          issue_description: raiseForm.issue_description,
          priority: raiseForm.priority,
          photo_url: raiseForm.photo_url
        })
      });
      const data = await res.json();
      if (data.success) {
        setRaiseForm(null);
        fetchData();
      } else {
        alert(data.error || "Failed to raise request");
      }
    } catch (err) {
      alert("Error saving request");
    }
  };

  const executeAction = async (endpoint, payload = null) => {
    try {
      const options = { method: 'PUT', headers };
      if (payload) options.body = JSON.stringify(payload);
      
      const res = await fetch(endpoint, options);
      const data = await res.json();
      if (data.success) {
        fetchData();
        return true;
      } else {
        alert(data.error || "Action failed");
        return false;
      }
    } catch (err) {
      alert("Network error");
      return false;
    }
  };

  const approve = (id) => executeAction(API_ENDPOINTS.MAINTENANCE.APPROVE(id));
  const reject = (id) => executeAction(API_ENDPOINTS.MAINTENANCE.REJECT(id));
  const startWork = (id) => executeAction(API_ENDPOINTS.MAINTENANCE.START(id));

  const assign = async (event) => {
    event.preventDefault();
    const tech = technicians.find(t => t.engineer_id === assigning.engineer_id);
    const success = await executeAction(API_ENDPOINTS.MAINTENANCE.ASSIGN(assigning.id), {
      engineer_id: assigning.engineer_id,
      engineer_name: tech?.name
    });
    if (success) setAssigning(null);
  };

  const resolve = async (event) => {
    event.preventDefault();
    const success = await executeAction(API_ENDPOINTS.MAINTENANCE.RESOLVE(resolving.id), {
      resolution: resolving.resolution
    });
    if (success) setResolving(null);
  };
  
  if (loading && requests.length === 0) {
    return <div className="p-10 text-center text-slate-500">Loading maintenance data...</div>;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#7a6475]">Repair workflow</p>
          <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
            Maintenance Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Route asset repairs through approval, technician assignment and
            resolution.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white"
          onClick={() =>
            setRaiseForm({
              asset_id: "",
              issue_description: "",
              priority: "Medium",
              photo_url: "",
            })
          }
        >
          <Plus size={18} />
          Raise Request
        </button>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {[
          [
            "Pending",
            requests.filter((item) => item.status === "Pending").length,
            Clock3,
          ],
          [
            "Approved",
            requests.filter((item) => item.status === "Approved").length,
            Check,
          ],
          [
            "Assigned / In Progress",
            requests.filter((item) =>
              ["Technician Assigned", "In Progress"].includes(item.status),
            ).length,
            UserCog,
          ],
          [
            "Resolved",
            requests.filter((item) => item.status === "Resolved").length,
            Wrench,
          ],
          [
            "Critical / High",
            requests.filter(
              (item) =>
                ["Critical", "High"].includes(item.priority) &&
                item.status !== "Resolved",
            ).length,
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
        <div className="flex items-center gap-3 border-b border-[#e6dee4] p-5">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3 outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search request, asset, issue or technician..."
            />
          </div>
          <select
            className="rounded-lg border border-[#ddd3da] px-3 py-2.5 text-sm"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left text-sm">
            <thead>
              <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
                {[
                  "Request",
                  "Asset",
                  "Issue",
                  "Priority",
                  "Raised By",
                  "Technician",
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
              {visible.map((item) => (
                <tr key={item.request_id} className="border-b border-slate-100">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#4f3448]">{item.request_id.substring(0,8)}...</p>
                    <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-[#31232e]">
                      {item.asset_name}
                    </p>
                    <p className="text-xs text-slate-500">{item.asset_tag}</p>
                  </td>
                  <td className="max-w-72 px-4 py-4 text-slate-600">
                    {item.issue_description}
                  </td>
                  <td className="px-4 py-4">
                    <Priority value={item.priority} />
                  </td>
                  <td className="px-4 py-4 text-slate-600">{item.raised_by_name}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {item.technician_name || "Not assigned"}
                  </td>
                  <td className="px-4 py-4">
                    <Status value={item.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        title="View history"
                        className="text-[#4f3448]"
                        onClick={() => setSelected(item)}
                      >
                        <Eye size={17} />
                      </button>
                      {item.status === "Pending" && (
                        <>
                          <button
                            className="font-medium text-emerald-700 hover:underline"
                            onClick={() => approve(item.request_id)}
                          >
                            Approve
                          </button>
                          <button
                            className="font-medium text-red-700 hover:underline"
                            onClick={() => reject(item.request_id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {item.status === "Approved" && (
                        <button
                          className="font-medium text-[#4f3448] hover:underline"
                          onClick={() =>
                            setAssigning({ id: item.request_id, engineer_id: "" })
                          }
                        >
                          Assign Technician
                        </button>
                      )}
                      {item.status === "Technician Assigned" && (
                        <button
                          className="font-medium text-[#4f3448] hover:underline"
                          onClick={() => startWork(item.request_id)}
                        >
                          Start Work
                        </button>
                      )}
                      {item.status === "In Progress" && (
                        <button
                          className="font-medium text-emerald-700 hover:underline"
                          onClick={() =>
                            setResolving({
                              id: item.request_id,
                              resolution: "",
                            })
                          }
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No maintenance requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      {raiseForm && (
        <RaiseModal
          form={raiseForm}
          setForm={setRaiseForm}
          assets={assets}
          submit={raise}
          close={() => setRaiseForm(null)}
        />
      )}
      {assigning && (
        <SimpleModal
          title="Assign Technician"
          action="Assign"
          submit={assign}
          close={() => setAssigning(null)}
        >
          <Field label="Technician">
            <select
              required
              className={input}
              value={assigning.engineer_id}
              onChange={(event) =>
                setAssigning({ ...assigning, engineer_id: event.target.value })
              }
            >
              <option value="">Select technician</option>
              {technicians.map((item) => (
                <option key={item.engineer_id} value={item.engineer_id}>{item.name}</option>
              ))}
            </select>
          </Field>
        </SimpleModal>
      )}
      {resolving && (
        <SimpleModal
          title="Resolve Maintenance Request"
          action="Mark Resolved"
          submit={resolve}
          close={() => setResolving(null)}
        >
          <Field label="Resolution Notes">
            <textarea
              required
              className={input}
              rows="5"
              value={resolving.resolution}
              onChange={(event) =>
                setResolving({ ...resolving, resolution: event.target.value })
              }
              placeholder="Describe the work completed and final asset condition..."
            />
          </Field>
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
            Resolving this request will automatically change the asset's overall status back to Available.
          </p>
        </SimpleModal>
      )}
      {selected && (
        <HistoryPanel
          request={selected}
          close={() => setSelected(null)}
        />
      )}
    </div>
  );
}

const input =
  "mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448]";

function RaiseModal({ form, setForm, assets, submit, close }) {
  const update = (event) => {
    const { name, value, files } = event.target;
    setForm({ ...form, [name]: files ? files[0]?.name || "" : value });
  };
  return (
    <SimpleModal
      title="Raise Maintenance Request"
      action="Submit Request"
      submit={submit}
      close={close}
    >
      <div className="space-y-4">
        <Field label="Asset">
          <select
            required
            className={input}
            name="asset_id"
            value={form.asset_id}
            onChange={update}
          >
            <option value="">Select asset</option>
            {assets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.asset_tag} · {item.name} · {item.status}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Issue Description">
          <textarea
            required
            className={input}
            name="issue_description"
            rows="4"
            value={form.issue_description}
            onChange={update}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <select
              className={input}
              name="priority"
              value={form.priority}
              onChange={update}
            >
              {["Low", "Medium", "High", "Critical"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Issue Photo (optional)">
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#cdbfc9] p-3 text-sm text-slate-500">
            <Camera size={17} />
            {form.photo_url || "Attach photo"}
            <input
              hidden
              name="photo_url"
              type="file"
              accept="image/*"
              onChange={update}
            />
          </label>
        </Field>
        <p className="rounded-lg bg-[#f7f3f6] p-3 text-xs text-[#4f3448]">
          New requests start as Pending. The asset status changes only after
          approval.
        </p>
      </div>
    </SimpleModal>
  );
}

function SimpleModal({ title, action, submit, close, children }) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6 backdrop-blur-sm">
      <form
        className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
        onSubmit={submit}
      >
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-semibold text-[#31232e]">{title}</h2>
          <button type="button" onClick={close}>
            <X size={19} />
          </button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            className="rounded-lg border px-4 py-2.5"
            type="button"
            onClick={close}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#4f3448] px-4 py-2.5 font-medium text-white"
            type="submit"
          >
            {action}
          </button>
        </div>
      </form>
    </div>
  );
}

function HistoryPanel({ request, close }) {
  const history = request.history || [];
  
  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/25 backdrop-blur-sm">
      <div className="h-full w-[520px] overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex justify-between">
          <div>
            <p className="font-semibold text-[#4f3448]">{request.request_id.substring(0,8)}...</p>
            <h2 className="mt-1 text-xl font-semibold text-[#31232e]">
              {request.asset_name}
            </h2>
            <p className="text-sm text-slate-500">
              Asset status: {request.asset_status || "Unknown"}
            </p>
          </div>
          <button onClick={close}>
            <X size={19} />
          </button>
        </div>
        <div className="mt-6 rounded-lg bg-[#f8f5f7] p-4">
          <p className="text-sm font-medium text-[#31232e]">{request.issue_description}</p>
          <p className="mt-2 text-xs text-slate-500">
            Priority: {request.priority} · Technician:{" "}
            {request.technician_name || "Not assigned"}
          </p>
        </div>
        <h3 className="mt-6 font-semibold text-[#31232e]">
          Maintenance History
        </h3>
        <div className="mt-4 space-y-4">
          {history.length === 0 && <p className="text-sm text-slate-500">No history available.</p>}
          {history.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="border-l-2 border-[#d9ccd5] pb-4 pl-4"
            >
              <p className="font-medium text-[#31232e]">{item.event}</p>
              <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
            </div>
          ))}
        </div>
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

function Priority({ value }) {
  const style = {
    Low: "bg-slate-100 text-slate-600",
    Medium: "bg-blue-50 text-blue-700",
    High: "bg-amber-50 text-amber-700",
    Critical: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style[value]}`}
    >
      {value}
    </span>
  );
}

function Status({ value }) {
  const style = {
    Pending: "bg-amber-50 text-amber-700",
    Approved: "bg-blue-50 text-blue-700",
    Rejected: "bg-red-50 text-red-700",
    "Technician Assigned": "bg-violet-50 text-violet-700",
    "In Progress": "bg-cyan-50 text-cyan-700",
    Resolved: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style[value]}`}
    >
      {value}
    </span>
  );
}
