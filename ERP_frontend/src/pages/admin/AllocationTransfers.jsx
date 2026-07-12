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

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const people = [
  "Priya Sharma",
  "Raj Malhotra",
  "Neha Kapoor",
  "Aman Gupta",
  "Rahul Verma",
];
const departments = [
  "Information Technology",
  "Human Resources",
  "Finance",
  "Operations",
  "Administration",
];
const initialAssets = [
  {
    tag: "AF-0114",
    name: "Dell Latitude 5440",
    status: "Allocated",
    holder: "Priya Sharma",
    department: "Information Technology",
  },
  {
    tag: "AF-0087",
    name: "Epson Projector",
    status: "Allocated",
    holder: "Operations Department",
    department: "Operations",
  },
  {
    tag: "AF-0172",
    name: "iPhone 15",
    status: "Available",
    holder: "",
    department: "",
  },
  {
    tag: "AF-0201",
    name: "HP EliteBook",
    status: "Available",
    holder: "",
    department: "",
  },
];
const initialAllocations = [
  {
    id: "AL-0184",
    assetTag: "AF-0114",
    assetName: "Dell Latitude 5440",
    holder: "Priya Sharma",
    holderType: "Employee",
    department: "Information Technology",
    allocatedOn: "2026-06-02",
    expectedReturn: "2026-07-08",
    status: "Active",
    history: ["Allocated to Priya Sharma on 02 Jun 2026"],
  },
  {
    id: "AL-0179",
    assetTag: "AF-0087",
    assetName: "Epson Projector",
    holder: "Operations Department",
    holderType: "Department",
    department: "Operations",
    allocatedOn: "2026-06-18",
    expectedReturn: "2026-07-20",
    status: "Active",
    history: ["Allocated to Operations on 18 Jun 2026"],
  },
];
const initialTransfers = [
  {
    id: "TR-0091",
    assetTag: "AF-0114",
    assetName: "Dell Latitude 5440",
    from: "Priya Sharma",
    to: "Raj Malhotra",
    department: "Information Technology",
    reason: "Project reassignment",
    requestedOn: "2026-07-11",
    status: "Requested",
  },
];

const readStored = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export default function AllocationTransfers() {
  const [tab, setTab] = useState("allocations");
  const [assets, setAssets] = useState(() => readStored("assetflow_assets", initialAssets));
  const [allocations, setAllocations] = useState(() => readStored("assetflow_allocations", initialAllocations));
  const [transfers, setTransfers] = useState(() => readStored("assetflow_transfers", initialTransfers));
  const [returns, setReturns] = useState(() => readStored("assetflow_returns", []));
  const [search, setSearch] = useState("");
  const [allocateForm, setAllocateForm] = useState(null);
  const [transferForm, setTransferForm] = useState(null);
  const [returnForm, setReturnForm] = useState(null);
  const active = allocations.filter((item) => item.status === "Active");
  const overdue = active.filter(
    (item) =>
      item.expectedReturn &&
      new Date(`${item.expectedReturn}T00:00:00`) < TODAY,
  );

  useEffect(() => {
    localStorage.setItem(
      "assetflow_overdue_allocations",
      JSON.stringify(overdue),
    );
  }, [overdue]);
  useEffect(() => {
    localStorage.setItem("assetflow_assets", JSON.stringify(assets));
  }, [assets]);
  useEffect(() => {
    localStorage.setItem("assetflow_allocations", JSON.stringify(allocations));
  }, [allocations]);
  useEffect(() => {
    localStorage.setItem("assetflow_transfers", JSON.stringify(transfers));
  }, [transfers]);
  useEffect(() => {
    localStorage.setItem("assetflow_returns", JSON.stringify(returns));
  }, [returns]);
  const visible = useMemo(
    () =>
      active.filter((item) =>
        [item.assetTag, item.assetName, item.holder, item.department].some(
          (value) => value.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [active, search],
  );
  const selectedAsset =
    allocateForm && assets.find((item) => item.tag === allocateForm.assetTag);
  const conflict =
    selectedAsset?.status !== "Available"
      ? active.find((item) => item.assetTag === selectedAsset?.tag) || {
          assetTag: selectedAsset?.tag,
          holder: selectedAsset?.holder || "another holder or workflow",
          department: selectedAsset?.department || "",
        }
      : null;

  const allocate = (event) => {
    event.preventDefault();
    if (!selectedAsset || conflict) return;
    const holder =
      allocateForm.holderType === "Employee"
        ? allocateForm.employee
        : allocateForm.department;
    const department =
      allocateForm.holderType === "Employee"
        ? allocateForm.employeeDepartment
        : allocateForm.department;
    const item = {
      id: `AL-${String(185 + allocations.length).padStart(4, "0")}`,
      assetTag: selectedAsset.tag,
      assetName: selectedAsset.name,
      holder,
      holderType: allocateForm.holderType,
      department,
      allocatedOn: "2026-07-12",
      expectedReturn: allocateForm.expectedReturn,
      status: "Active",
      history: [`Allocated to ${holder} on 12 Jul 2026`],
    };
    setAllocations([...allocations, item]);
    setAssets(
      assets.map((asset) =>
        asset.tag === item.assetTag
          ? { ...asset, status: "Allocated", holder, department, allocationHistory: [...(asset.allocationHistory || []), { event: `Allocated to ${holder}`, date: "12 Jul 2026", detail: department }] }
          : asset,
      ),
    );
    setAllocateForm(null);
  };
  const requestTransfer = (event) => {
    event.preventDefault();
    const current = active.find(
      (item) => item.assetTag === transferForm.assetTag,
    );
    setTransfers([
      ...transfers,
      {
        id: `TR-${String(92 + transfers.length).padStart(4, "0")}`,
        assetTag: current.assetTag,
        assetName: current.assetName,
        from: current.holder,
        to: transferForm.to,
        department: transferForm.department,
        reason: transferForm.reason,
        requestedOn: "2026-07-12",
        status: "Requested",
      },
    ]);
    setTransferForm(null);
    setTab("transfers");
  };
  const approve = (request) => {
    setTransfers(
      transfers.map((item) =>
        item.id === request.id ? { ...item, status: "Approved" } : item,
      ),
    );
    setAllocations(
      allocations.map((item) =>
        item.assetTag === request.assetTag && item.status === "Active"
          ? {
              ...item,
              holder: request.to,
              department: request.department,
              history: [
                ...item.history,
                `Transferred from ${request.from} to ${request.to} on 12 Jul 2026`,
              ],
            }
          : item,
      ),
    );
    setAssets(
      assets.map((item) =>
        item.tag === request.assetTag
          ? { ...item, holder: request.to, department: request.department, allocationHistory: [...(item.allocationHistory || []), { event: `Transferred from ${request.from} to ${request.to}`, date: "12 Jul 2026", detail: request.department }] }
          : item,
      ),
    );
  };
  const processReturn = (event) => {
    event.preventDefault();
    const current = active.find((item) => item.id === returnForm.id);
    setAllocations(
      allocations.map((item) =>
        item.id === current.id
          ? {
              ...item,
              status: "Returned",
              history: [
                ...item.history,
                `Returned on 12 Jul 2026 · ${returnForm.condition}`,
              ],
            }
          : item,
      ),
    );
    setAssets(
      assets.map((item) =>
        item.tag === current.assetTag
          ? { ...item, status: "Available", holder: "", department: "", allocationHistory: [...(item.allocationHistory || []), { event: `Returned by ${current.holder}`, date: "12 Jul 2026", detail: `Condition: ${returnForm.condition}` }] }
          : item,
      ),
    );
    setReturns([
      {
        id: `RT-${String(returns.length + 1).padStart(4, "0")}`,
        assetTag: current.assetTag,
        assetName: current.assetName,
        holder: current.holder,
        condition: returnForm.condition,
        notes: returnForm.notes,
        date: "12 Jul 2026",
      },
      ...returns,
    ]);
    setReturnForm(null);
    setTab("returns");
  };
  const openTransfer = (item) =>
    setTransferForm({
      assetTag: item.assetTag,
      to: "",
      department: item.department,
      reason: "",
    });
  const openConflictTransfer = () => {
    openTransfer(conflict);
    setAllocateForm(null);
  };
  const tabs = [
    ["allocations", "Active Allocations", PackageCheck],
    ["transfers", "Transfer Requests", ArrowRightLeft],
    ["returns", "Returns", RotateCcw],
    ["overdue", "Overdue", Clock3],
  ];

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
              assetTag: "",
              holderType: "Employee",
              employee: "",
              employeeDepartment: "",
              department: "",
              expectedReturn: "",
            })
          }
        >
          <Plus size={18} />
          Allocate Asset
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          ["Active Allocations", active.length, PackageCheck],
          [
            "Available Assets",
            assets.filter((item) => item.status === "Available").length,
            Check,
          ],
          [
            "Pending Transfers",
            transfers.filter((item) => item.status === "Requested").length,
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
              <span className="rounded-full bg-red-500 px-2 text-xs">
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
              setReturnForm({ id: item.id, condition: "Good", notes: "" })
            }
          />
        )}
        {tab === "overdue" && (
          <AllocationTable
            rows={overdue}
            overdue={overdue}
            onTransfer={openTransfer}
            onReturn={(item) =>
              setReturnForm({ id: item.id, condition: "Good", notes: "" })
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
          assets={assets}
          conflict={conflict}
          submit={allocate}
          close={() => setAllocateForm(null)}
          transfer={openConflictTransfer}
        />
      )}
      {transferForm && (
        <TransferModal
          form={transferForm}
          setForm={setTransferForm}
          current={active.find(
            (item) => item.assetTag === transferForm.assetTag,
          )}
          submit={requestTransfer}
          close={() => setTransferForm(null)}
        />
      )}
      {returnForm && (
        <ReturnModal
          form={returnForm}
          setForm={setReturnForm}
          current={active.find((item) => item.id === returnForm.id)}
          submit={processReturn}
          close={() => setReturnForm(null)}
        />
      )}
    </div>
  );
}

function AllocationTable({ rows, overdue, onTransfer, onReturn }) {
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
        return (
          <tr key={item.id} className="border-b border-slate-100">
            <Cell strong>{item.id}</Cell>
            <Cell>
              {item.assetName}
              <small>{item.assetTag}</small>
            </Cell>
            <Cell>
              {item.holder}
              <small>{item.holderType}</small>
            </Cell>
            <Cell>{item.department}</Cell>
            <Cell>{item.allocatedOn}</Cell>
            <Cell danger={late}>
              {item.expectedReturn || "No return date"}
              {late && <small>Overdue</small>}
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
    </Table>
  );
}
function Transfers({ rows, approve }) {
  return (
    <Table
      headers={[
        "Request",
        "Asset",
        "From",
        "Transfer To",
        "Reason",
        "Requested",
        "Status",
        "Action",
      ]}
    >
      {rows.map((item) => (
        <tr key={item.id} className="border-b border-slate-100">
          <Cell strong>{item.id}</Cell>
          <Cell>
            {item.assetName}
            <small>{item.assetTag}</small>
          </Cell>
          <Cell>{item.from}</Cell>
          <Cell>{item.to}</Cell>
          <Cell>{item.reason}</Cell>
          <Cell>{item.requestedOn}</Cell>
          <Cell>
            <Badge type={item.status === "Approved" ? "success" : "warning"}>
              {item.status}
            </Badge>
          </Cell>
          <Cell>
            {item.status === "Requested" ? (
              <button
                className="font-medium text-emerald-700 hover:underline"
                onClick={() => approve(item)}
              >
                Approve & Re-allocate
              </button>
            ) : (
              <span className="text-xs text-slate-400">History updated</span>
            )}
          </Cell>
        </tr>
      ))}
    </Table>
  );
}
function Returns({ rows }) {
  return (
    <Table
      headers={[
        "Return ID",
        "Asset",
        "Returned By",
        "Date",
        "Condition",
        "Notes",
        "Asset Status",
      ]}
    >
      {rows.map((item) => (
        <tr key={item.id} className="border-b border-slate-100">
          <Cell strong>{item.id}</Cell>
          <Cell>
            {item.assetName}
            <small>{item.assetTag}</small>
          </Cell>
          <Cell>{item.holder}</Cell>
          <Cell>{item.date}</Cell>
          <Cell>{item.condition}</Cell>
          <Cell>{item.notes}</Cell>
          <Cell>
            <Badge type="success">Available</Badge>
          </Cell>
        </tr>
      ))}
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
function Cell({ children, strong, danger }) {
  return (
    <td
      className={`px-4 py-4 ${strong ? "font-semibold text-[#4f3448]" : danger ? "font-semibold text-red-700" : "text-slate-600"}`}
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
  "mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448]";
function Modal({ title, detail, submit, close, action, children }) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6">
      <form
        className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
        onSubmit={submit}
      >
        <div className="mb-5 flex justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#31232e]">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{detail}</p>
          </div>
          <button type="button" onClick={close}>
            <X size={19} />
          </button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-3">
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
function AllocateModal({
  form,
  setForm,
  assets,
  conflict,
  submit,
  close,
  transfer,
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
            name="assetTag"
            value={form.assetTag}
            onChange={update}
          >
            <option value="">Select asset</option>
            {assets.map((item) => (
              <option key={item.tag} value={item.tag}>
                {item.tag} · {item.name} · {item.status}
              </option>
            ))}
          </select>
        </Field>
        {conflict && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-red-600" />
              <div>
                <p className="font-semibold text-red-800">Allocation blocked</p>
                <p className="text-sm text-red-700">
                  Currently held by <strong>{conflict.holder}</strong>.
                </p>
                <button
                  className="mt-2 font-medium text-[#4f3448] underline"
                  type="button"
                  onClick={transfer}
                >
                  Create Transfer Request instead
                </button>
              </div>
            </div>
          </div>
        )}
        <Field label="Allocate To">
          <select
            className={input}
            name="holderType"
            value={form.holderType}
            onChange={update}
          >
            <option>Employee</option>
            <option>Department</option>
          </select>
        </Field>
        {form.holderType === "Employee" ? (
          <>
            <Field label="Employee">
              <Select
                name="employee"
                value={form.employee}
                values={people}
                update={update}
              />
            </Field>
            <Field label="Employee Department">
              <Select
                name="employeeDepartment"
                value={form.employeeDepartment}
                values={departments}
                update={update}
              />
            </Field>
          </>
        ) : (
          <Field label="Department">
            <Select
              name="department"
              value={form.department}
              values={departments}
              update={update}
            />
          </Field>
        )}
        <Field label="Expected Return Date (optional)">
          <input
            className={input}
            min="2026-07-12"
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
function TransferModal({ form, setForm, current, submit, close }) {
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  return (
    <Modal
      title="Transfer Request"
      detail={`${current?.assetTag || ""} is currently held by ${current?.holder || ""}.`}
      submit={submit}
      close={close}
      action="Submit Request"
    >
      <div className="space-y-4">
        <Field label="Transfer To">
          <Select
            name="to"
            value={form.to}
            values={people.filter((item) => item !== current?.holder)}
            update={update}
          />
        </Field>
        <Field label="Department">
          <Select
            name="department"
            value={form.department}
            values={departments}
            update={update}
          />
        </Field>
        <Field label="Reason">
          <textarea
            required
            className={input}
            name="reason"
            rows="3"
            value={form.reason}
            onChange={update}
          />
        </Field>
        <p className="rounded-lg bg-[#f7f3f6] p-3 text-xs text-[#4f3448]">
          Requested → Approved → Automatically re-allocated with updated
          history.
        </p>
      </div>
    </Modal>
  );
}
function ReturnModal({ form, setForm, current, submit, close }) {
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  return (
    <Modal
      title="Mark Returned"
      detail={`${current?.assetTag || ""} · ${current?.holder || ""}`}
      submit={submit}
      close={close}
      action="Complete Return"
    >
      <div className="space-y-4">
        <Field label="Condition at Check-in">
          <Select
            name="condition"
            value={form.condition}
            values={["Excellent", "Good", "Fair", "Poor", "Damaged"]}
            update={update}
          />
        </Field>
        <Field label="Check-in Notes">
          <textarea
            required
            className={input}
            name="notes"
            rows="4"
            value={form.notes}
            onChange={update}
          />
        </Field>
        <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
          Asset status will revert to Available.
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
function Select({ name, value, values, update }) {
  return (
    <select
      required
      className={input}
      name={name}
      value={value}
      onChange={update}
    >
      <option value="">Select option</option>
      {values.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </select>
  );
}
