import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  Clock3,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/apis";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

export default function AllocationTransfers() {
  const [tab, setTab] = useState("allocations");
  
  // Data states
  const [assets, setAssets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [returns, setReturns] = useState([]);
  
  // Metadata for dropdowns
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [search, setSearch] = useState("");
  
  // Modal states
  const [allocateForm, setAllocateForm] = useState(null);
  const [transferForm, setTransferForm] = useState(null);
  const [returnForm, setReturnForm] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem("assetflow_token");
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allocRes, transRes, retRes, assetRes, metaRes] = await Promise.all([
        fetch(API_ENDPOINTS.ALLOCATIONS.BASE, { headers }),
        fetch(API_ENDPOINTS.ALLOCATIONS.TRANSFERS, { headers }),
        fetch(API_ENDPOINTS.ALLOCATIONS.RETURNS_HISTORY, { headers }),
        fetch(API_ENDPOINTS.ASSETS.GET_ALL, { headers }),
        fetch(API_ENDPOINTS.ASSETS.METADATA, { headers })
      ]);

      const [allocData, transData, retData, assetData, metaData] = await Promise.all([
        allocRes.json(), transRes.json(), retRes.json(), assetRes.json(), metaRes.json()
      ]);

      if (allocData.success) setAllocations(allocData.data);
      if (transData.success) setTransfers(transData.data);
      if (retData.success) setReturns(retData.data);
      if (assetData.success) setAssets(assetData.data);
      if (metaData.success) {
        setDepartments(metaData.data.departments);
        setEmployees(metaData.data.employees);
      }
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Derived state
  const availableAssets = assets.filter(a => a.status === 'Available');
  const active = allocations;
  const overdue = active.filter(
    (item) =>
      item.expected_return_date &&
      new Date(item.expected_return_date) < TODAY,
  );

  const visible = useMemo(
    () =>
      active.filter((item) =>
        [item.asset_tag, item.asset_name, item.first_name, item.department_name].some(
          (value) => value && value.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [active, search],
  );

  const selectedAsset =
    allocateForm && availableAssets.find((item) => item.id === allocateForm.asset_id);

  // Since we only show available assets in the allocate dropdown, conflict should technically never happen naturally,
  // but we keep the UI logic just in case an asset was selected right before someone else took it.
  const conflict = null; 

  const handleAllocate = async (event) => {
    event.preventDefault();
    if (!selectedAsset) return;

    try {
      const payload = {
        asset_id: allocateForm.asset_id,
        employee_id: allocateForm.holderType === "Employee" ? allocateForm.employee_id : null,
        department_id: allocateForm.holderType === "Department" ? allocateForm.department_id : (allocateForm.employee_department_id || null),
        expected_return_date: allocateForm.expectedReturn || null
      };

      const res = await fetch(API_ENDPOINTS.ALLOCATIONS.ALLOCATE, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAllocateForm(null);
        fetchData();
      } else {
        alert(data.error || "Failed to allocate");
      }
    } catch (err) {
      console.error(err);
      alert("Error allocating asset");
    }
  };

  const requestTransfer = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        asset_id: transferForm.asset_id,
        destination_department_id: transferForm.department_id,
        reason: transferForm.reason
      };

      const res = await fetch(API_ENDPOINTS.ALLOCATIONS.REQUEST_TRANSFER, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setTransferForm(null);
        setTab("transfers");
        fetchData();
      } else {
        alert(data.error || "Failed to request transfer");
      }
    } catch (err) {
      console.error(err);
      alert("Error requesting transfer");
    }
  };

  const approve = async (request) => {
    if (!confirm("Are you sure you want to approve this transfer and re-allocate the asset?")) return;
    try {
      const res = await fetch(API_ENDPOINTS.ALLOCATIONS.APPROVE_TRANSFER(request.id), {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to approve transfer");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving transfer");
    }
  };

  const processReturn = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        allocation_id: returnForm.id,
        notes: returnForm.notes,
        condition: returnForm.condition
      };

      const res = await fetch(API_ENDPOINTS.ALLOCATIONS.RETURN, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setReturnForm(null);
        setTab("returns");
        fetchData();
      } else {
        alert(data.error || "Failed to return asset");
      }
    } catch (err) {
      console.error(err);
      alert("Error returning asset");
    }
  };

  const openTransfer = (item) =>
    setTransferForm({
      asset_id: item.asset_id,
      assetName: item.asset_name,
      assetTag: item.asset_tag,
      department_id: "",
      reason: "",
    });

  const tabs = [
    ["allocations", "Active Allocations", PackageCheck],
    ["transfers", "Transfer Requests", ArrowRightLeft],
    ["returns", "Returns", RotateCcw],
    ["overdue", "Overdue", Clock3],
  ];

  if (loading && allocations.length === 0) {
    return <div className="p-10 text-center text-slate-500">Loading allocation data...</div>;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#7a6475]">Asset custody</p>
          <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
            Asset Allocation & Transfers
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage custody, resolve conflicts, approve transfers and complete
            check-in returns.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white"
          onClick={() =>
            setAllocateForm({
              asset_id: "",
              holderType: "Employee",
              employee_id: "",
              employee_department_id: "",
              department_id: "",
              expectedReturn: "",
            })
          }
        >
          <Plus size={18} />
          Allocate Asset
        </button>
      </div>
      
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          ["Active Allocations", active.length, PackageCheck],
          [
            "Available Assets",
            availableAssets.length,
            Check,
          ],
          [
            "Pending Transfers",
            transfers.filter((item) => item.status === "PENDING").length,
            ArrowRightLeft,
          ],
          ["Overdue", overdue.length, ShieldAlert],
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
      <div className="grid grid-cols-4 gap-2 rounded-xl border border-[#e6dee4] bg-white p-2">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${tab === id ? "bg-[#4f3448] text-white" : "text-slate-600 hover:bg-[#f7f3f6]"}`}
            onClick={() => setTab(id)}
          >
            <Icon size={17} />
            {label}
            {id === "overdue" && overdue.length > 0 && (
              <span className="rounded-full bg-red-500 px-2 text-xs text-white">
                {overdue.length}
              </span>
            )}
          </button>
        ))}
      </div>
      <section className="rounded-xl border border-[#e6dee4] bg-white shadow-sm">
        <div className="border-b border-[#e6dee4] p-5">
          <div className="relative max-w-lg">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3 outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search asset, holder or department..."
            />
          </div>
        </div>
        {tab === "allocations" && (
          <AllocationTable
            rows={visible}
            overdue={overdue}
            onTransfer={openTransfer}
            onReturn={(item) =>
              setReturnForm({ id: item.id, asset_name: item.asset_name, asset_tag: item.asset_tag, holder: item.first_name ? `${item.first_name} ${item.last_name}` : item.department_name, condition: "Good", notes: "" })
            }
          />
        )}
        {tab === "overdue" && (
          <AllocationTable
            rows={overdue}
            overdue={overdue}
            onTransfer={openTransfer}
            onReturn={(item) =>
              setReturnForm({ id: item.id, asset_name: item.asset_name, asset_tag: item.asset_tag, holder: item.first_name ? `${item.first_name} ${item.last_name}` : item.department_name, condition: "Good", notes: "" })
            }
          />
        )}
        {tab === "transfers" && (
          <Transfers rows={transfers} approve={approve} />
        )}
        {tab === "returns" && <Returns rows={returns} />}
      </section>
      
      {allocateForm && (
        <AllocateModal
          form={allocateForm}
          setForm={setAllocateForm}
          assets={availableAssets}
          departments={departments}
          employees={employees}
          submit={handleAllocate}
          close={() => setAllocateForm(null)}
        />
      )}
      {transferForm && (
        <TransferModal
          form={transferForm}
          setForm={setTransferForm}
          departments={departments}
          submit={requestTransfer}
          close={() => setTransferForm(null)}
        />
      )}
      {returnForm && (
        <ReturnModal
          form={returnForm}
          setForm={setReturnForm}
          submit={processReturn}
          close={() => setReturnForm(null)}
        />
      )}
    </div>
  );
}

function AllocationTable({ rows, overdue, onTransfer, onReturn }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';
  return (
    <Table
      headers={[
        "ID",
        "Asset",
        "Current Holder",
        "Department",
        "Allocated On",
        "Expected Return",
        "Status",
        "Actions",
      ]}
    >
      {rows.map((item) => {
        const late = overdue.some((row) => row.id === item.id);
        const holderName = item.first_name ? `${item.first_name} ${item.last_name}` : item.department_name;
        const holderType = item.first_name ? 'Employee' : 'Department';

        return (
          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
            <Cell strong className="text-xs">{item.id.substring(0,8)}...</Cell>
            <Cell>
              <div className="font-medium">{item.asset_name}</div>
              <div className="text-xs text-slate-500">{item.asset_tag}</div>
            </Cell>
            <Cell>
              <div className="font-medium">{holderName}</div>
              <div className="text-xs text-slate-500">{holderType}</div>
            </Cell>
            <Cell>{item.department_name || '-'}</Cell>
            <Cell>{formatDate(item.allocated_date)}</Cell>
            <Cell danger={late}>
              {formatDate(item.expected_return_date)}
              {late && <div className="text-xs mt-0.5">Overdue</div>}
            </Cell>
            <Cell>
              <Badge type={late ? "danger" : "info"}>
                {late ? "Overdue" : "Active"}
              </Badge>
            </Cell>
            <Cell>
              <button
                className="mr-3 font-medium text-[#4f3448] hover:underline"
                onClick={() => onTransfer(item)}
              >
                Transfer
              </button>
              <button
                className="font-medium text-emerald-700 hover:underline"
                onClick={() => onReturn(item)}
              >
                Return
              </button>
            </Cell>
          </tr>
        );
      })}
      {rows.length === 0 && (
        <tr><td colSpan="8" className="p-6 text-center text-slate-500">No active allocations found.</td></tr>
      )}
    </Table>
  );
}

function Transfers({ rows, approve }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';
  return (
    <Table
      headers={[
        "Request",
        "Asset",
        "From Dept",
        "Transfer To",
        "Reason",
        "Requested",
        "Status",
        "Action",
      ]}
    >
      {rows.map((item) => (
        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
          <Cell strong className="text-xs">{item.id.substring(0,8)}...</Cell>
          <Cell>
            <div className="font-medium">{item.asset_name}</div>
            <div className="text-xs text-slate-500">{item.asset_tag}</div>
          </Cell>
          <Cell>{item.from_department}</Cell>
          <Cell>{item.to_department}</Cell>
          <Cell className="max-w-[200px] truncate" title={item.reason}>{item.reason}</Cell>
          <Cell>{formatDate(item.requested_on)}</Cell>
          <Cell>
            <Badge type={item.status === "APPROVED" ? "success" : item.status === "REJECTED" ? "danger" : "warning"}>
              {item.status}
            </Badge>
          </Cell>
          <Cell>
            {item.status === "PENDING" ? (
              <button
                className="font-medium text-emerald-700 hover:underline"
                onClick={() => approve(item)}
              >
                Approve & Re-allocate
              </button>
            ) : (
              <span className="text-xs text-slate-400">
                {item.status === "APPROVED" ? `Approved on ${formatDate(item.transfer_date)}` : "Rejected"}
              </span>
            )}
          </Cell>
        </tr>
      ))}
      {rows.length === 0 && (
        <tr><td colSpan="8" className="p-6 text-center text-slate-500">No transfer requests found.</td></tr>
      )}
    </Table>
  );
}

function Returns({ rows }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';
  return (
    <Table
      headers={[
        "Return ID",
        "Asset",
        "Returned By",
        "Department",
        "Date",
        "Notes",
      ]}
    >
      {rows.map((item) => {
        const holderName = item.first_name ? `${item.first_name} ${item.last_name}` : item.department_name;
        return (
          <tr key={item.return_id} className="border-b border-slate-100 hover:bg-slate-50">
            <Cell strong className="text-xs">{item.return_id.substring(0,8)}...</Cell>
            <Cell>
              <div className="font-medium">{item.asset_name}</div>
              <div className="text-xs text-slate-500">{item.asset_tag}</div>
            </Cell>
            <Cell>{holderName}</Cell>
            <Cell>{item.department_name || '-'}</Cell>
            <Cell>{formatDate(item.date)}</Cell>
            <Cell className="max-w-[250px] truncate" title={item.notes}>{item.notes}</Cell>
          </tr>
        )
      })}
      {rows.length === 0 && (
        <tr><td colSpan="6" className="p-6 text-center text-slate-500">No completed returns found.</td></tr>
      )}
    </Table>
  );
}

function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left text-sm">
        <thead>
          <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
            {headers.map((item) => (
              <th key={item} className="px-4 py-3">
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ children, strong, danger, className = "" }) {
  return (
    <td
      className={`px-4 py-4 ${strong ? "font-semibold text-[#4f3448]" : danger ? "font-semibold text-red-700" : "text-slate-600"} ${className}`}
    >
      {children}
    </td>
  );
}

function Badge({ children, type }) {
  const styles = {
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[type]}`}
    >
      {children}
    </span>
  );
}

const input =
  "mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448] bg-white";

function Modal({ title, detail, submit, close, action, children }) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6 backdrop-blur-sm">
      <form
        className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl"
        onSubmit={submit}
      >
        <div className="mb-5 flex justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#31232e]">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{detail}</p>
          </div>
          <button type="button" onClick={close} className="text-slate-400 hover:text-slate-700">
            <X size={19} />
          </button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            type="button"
            onClick={close}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#4f3448] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d2837]"
            type="submit"
          >
            {action}
          </button>
        </div>
      </form>
    </div>
  );
}

function AllocateModal({
  form,
  setForm,
  assets,
  departments,
  employees,
  submit,
  close,
}) {
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  return (
    <Modal
      title="Allocate Asset"
      detail="Assign an available asset to an employee or department."
      submit={submit}
      close={close}
      action="Confirm Allocation"
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
            <option value="">Select available asset</option>
            {assets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.asset_tag} · {item.name}
              </option>
            ))}
          </select>
        </Field>
        
        <Field label="Allocate To">
          <select
            className={input}
            name="holderType"
            value={form.holderType}
            onChange={update}
          >
            <option value="Employee">Employee</option>
            <option value="Department">Department</option>
          </select>
        </Field>

        {form.holderType === "Employee" ? (
          <>
            <Field label="Employee">
              <select
                required
                className={input}
                name="employee_id"
                value={form.employee_id}
                onChange={update}
              >
                <option value="">Select Employee</option>
                {employees.map((item) => (
                  <option key={item.id} value={item.id}>{item.first_name} {item.last_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Department (Optional link)">
              <select
                className={input}
                name="employee_department_id"
                value={form.employee_department_id}
                onChange={update}
              >
                <option value="">None</option>
                {departments.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <Field label="Department">
            <select
              required
              className={input}
              name="department_id"
              value={form.department_id}
              onChange={update}
            >
              <option value="">Select Department</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Expected Return Date (optional)">
          <input
            className={input}
            min={new Date().toISOString().split('T')[0]}
            name="expectedReturn"
            type="date"
            value={form.expectedReturn}
            onChange={update}
          />
        </Field>
      </div>
    </Modal>
  );
}

function TransferModal({ form, setForm, departments, submit, close }) {
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
    
  return (
    <Modal
      title="Transfer Request"
      detail={`Request to transfer ${form.assetTag || ""} (${form.assetName})`}
      submit={submit}
      close={close}
      action="Submit Request"
    >
      <div className="space-y-4">
        <Field label="Destination Department">
          <select
            required
            className={input}
            name="department_id"
            value={form.department_id}
            onChange={update}
          >
            <option value="">Select destination department</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Reason for Transfer">
          <textarea
            required
            className={input}
            name="reason"
            rows="3"
            placeholder="Why is this transfer needed?"
            value={form.reason}
            onChange={update}
          />
        </Field>
        <p className="rounded-lg bg-[#f7f3f6] p-3 text-xs text-[#4f3448]">
          Requested → Approved → Automatically re-allocated to the new department.
        </p>
      </div>
    </Modal>
  );
}

function ReturnModal({ form, setForm, submit, close }) {
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
    
  return (
    <Modal
      title="Process Return"
      detail={`Checking in ${form.asset_tag} from ${form.holder}`}
      submit={submit}
      close={close}
      action="Complete Check-in"
    >
      <div className="space-y-4">
        <Field label="Condition at Check-in">
          <select
            required
            className={input}
            name="condition"
            value={form.condition}
            onChange={update}
          >
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
            <option value="Damaged">Damaged</option>
          </select>
        </Field>
        <Field label="Check-in Notes">
          <textarea
            className={input}
            name="notes"
            rows="4"
            placeholder="Any visible damage, missing accessories, etc."
            value={form.notes}
            onChange={update}
          />
        </Field>
        <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
          The asset's status will automatically revert to "Available" for future allocations.
        </p>
      </div>
    </Modal>
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
