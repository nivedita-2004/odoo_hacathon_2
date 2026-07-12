import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  FileText,
  Filter,
  History,
  MapPin,
  PackagePlus,
  QrCode,
  Search,
  Upload,
  X,
} from "lucide-react";

const defaultCategories = ["Electronics", "Furniture", "Vehicles", "Office Equipment"];
const statuses = [
  "Available",
  "Allocated",
  "Reserved",
  "Under Maintenance",
  "Lost",
  "Retired",
  "Disposed",
];
const conditions = ["Excellent", "Good", "Fair", "Poor", "Damaged"];
const departments = [
  "Unassigned",
  "Information Technology",
  "Human Resources",
  "Finance",
  "Operations",
  "Administration",
];

const initialAssets = [
  {
    tag: "AF-0001",
    qr: "QR-AF-0001",
    name: "Dell Latitude 5440",
    category: "Electronics",
    serial: "DL5440-92841",
    acquisitionDate: "2026-01-12",
    acquisitionCost: "78500",
    condition: "Good",
    location: "IT Store - Floor 2",
    department: "Information Technology",
    status: "Allocated",
    shared: false,
    photo: "dell-latitude.jpg",
    documents: ["invoice-af0001.pdf"],
    allocationHistory: [
      {
        event: "Allocated to Priya Sharma",
        date: "02 Jul 2026",
        detail: "Information Technology",
      },
      {
        event: "Returned by Rahul Verma",
        date: "26 Jun 2026",
        detail: "Condition: Good",
      },
    ],
    maintenanceHistory: [
      {
        event: "Preventive service completed",
        date: "20 May 2026",
        detail: "Keyboard cleaned and OS updated",
      },
    ],
  },
  {
    tag: "AF-0002",
    qr: "QR-AF-0002",
    name: "Epson EB-X49 Projector",
    category: "Electronics",
    serial: "EPX49-11028",
    acquisitionDate: "2026-02-08",
    acquisitionCost: "46200",
    condition: "Excellent",
    location: "Resource Room A",
    department: "Administration",
    status: "Available",
    shared: true,
    photo: "projector.jpg",
    documents: ["warranty-af0002.pdf"],
    allocationHistory: [
      {
        event: "Returned to Resource Room",
        date: "08 Jul 2026",
        detail: "Previous booking completed",
      },
    ],
    maintenanceHistory: [],
  },
  {
    tag: "AF-0003",
    qr: "QR-AF-0003",
    name: "Honda City",
    category: "Vehicles",
    serial: "DL8CAF4821",
    acquisitionDate: "2025-10-18",
    acquisitionCost: "1240000",
    condition: "Good",
    location: "Main Parking",
    department: "Operations",
    status: "Reserved",
    shared: true,
    photo: "vehicle.jpg",
    documents: ["registration.pdf", "insurance.pdf"],
    allocationHistory: [
      {
        event: "Reserved by Operations Team",
        date: "12 Jul 2026",
        detail: "Site visit booking",
      },
    ],
    maintenanceHistory: [
      {
        event: "Scheduled service completed",
        date: "30 Jun 2026",
        detail: "Oil and filter replacement",
      },
    ],
  },
  {
    tag: "AF-0004",
    qr: "QR-AF-0004",
    name: "HP EliteBook 840",
    category: "Electronics",
    serial: "HP840-77340",
    acquisitionDate: "2025-11-21",
    acquisitionCost: "82400",
    condition: "Fair",
    location: "Service Center",
    department: "Finance",
    status: "Under Maintenance",
    shared: false,
    photo: "",
    documents: ["invoice-af0004.pdf"],
    allocationHistory: [
      {
        event: "Allocated to Neha Kapoor",
        date: "14 Jan 2026",
        detail: "Finance",
      },
    ],
    maintenanceHistory: [
      {
        event: "Battery replacement in progress",
        date: "10 Jul 2026",
        detail: "Ticket MR-118 · High priority",
      },
    ],
  },
  {
    tag: "AF-0005",
    qr: "QR-AF-0005",
    name: "Ergonomic Workstation",
    category: "Furniture",
    serial: "ERG-2026-015",
    acquisitionDate: "2026-03-04",
    acquisitionCost: "28500",
    condition: "Excellent",
    location: "HR - Floor 3",
    department: "Human Resources",
    status: "Allocated",
    shared: false,
    photo: "workstation.jpg",
    documents: [],
    allocationHistory: [
      {
        event: "Allocated to Ananya Mehta",
        date: "06 Mar 2026",
        detail: "Human Resources",
      },
    ],
    maintenanceHistory: [],
  },
];

const emptyForm = {
  name: "",
  category: "",
  serial: "",
  acquisitionDate: "",
  acquisitionCost: "",
  condition: "Good",
  location: "",
  department: "Unassigned",
  status: "Available",
  shared: false,
  photo: "",
  documents: [],
};

const statusStyle = {
  Available: "bg-emerald-50 text-emerald-700",
  Allocated: "bg-blue-50 text-blue-700",
  Reserved: "bg-violet-50 text-violet-700",
  "Under Maintenance": "bg-amber-50 text-amber-700",
  Lost: "bg-red-50 text-red-700",
  Retired: "bg-slate-100 text-slate-600",
  Disposed: "bg-gray-100 text-gray-600",
};

const readAssets = () => {
  try {
    return JSON.parse(localStorage.getItem("assetflow_assets")) || initialAssets;
  } catch {
    return initialAssets;
  }
};

export default function Assets() {
  const categoryOptions = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("assetflow_categories")) || [];
      const active = stored.filter((item) => item.status === "Active").map((item) => item.name);
      return active.length ? active : defaultCategories;
    } catch {
      return defaultCategories;
    }
  }, []);
  const [assets, setAssets] = useState(readAssets);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    department: "",
    location: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [historyTab, setHistoryTab] = useState("allocation");

  useEffect(() => {
    localStorage.setItem("assetflow_assets", JSON.stringify(assets));
  }, [assets]);

  const nextTag = `AF-${String(Math.max(0, ...assets.map((asset) => Number(asset.tag.split("-")[1]))) + 1).padStart(4, "0")}`;
  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        const term = search.trim().toLowerCase();
        const matchesSearch =
          !term ||
          [asset.tag, asset.qr, asset.name, asset.serial].some((value) =>
            value.toLowerCase().includes(term),
          );
        return (
          matchesSearch &&
          (!filters.category || asset.category === filters.category) &&
          (!filters.status || asset.status === filters.status) &&
          (!filters.department || asset.department === filters.department) &&
          (!filters.location ||
            asset.location
              .toLowerCase()
              .includes(filters.location.toLowerCase()))
        );
      }),
    [assets, search, filters],
  );

  const updateForm = (event) => {
    const { name, value, checked, type, files } = event.target;
    if (type === "file")
      setForm({
        ...form,
        [name]:
          name === "documents"
            ? Array.from(files).map((file) => file.name)
            : files[0]?.name || "",
      });
    else setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const registerAsset = (event) => {
    event.preventDefault();
    const asset = {
      ...form,
      tag: nextTag,
      qr: `QR-${nextTag}`,
      allocationHistory: [],
      maintenanceHistory: [],
    };
    setAssets([asset, ...assets]);
    setForm(null);
  };

  const changeFilter = (event) =>
    setFilters({ ...filters, [event.target.name]: event.target.value });
  const clearFilters = () => {
    setSearch("");
    setFilters({ category: "", status: "", department: "", location: "" });
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#7a6475]">
            Central asset registry
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
            Asset Registration & Directory
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Register assets and search, track or review their complete lifecycle
            centrally.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3e2939]"
          type="button"
          onClick={() => setForm({ ...emptyForm })}
        >
          <PackagePlus size={18} />
          Register Asset
        </button>
      </div>

      <section className="grid grid-cols-4 gap-4">
        {[
          ["Total Assets", assets.length],
          [
            "Available",
            assets.filter((asset) => asset.status === "Available").length,
          ],
          [
            "Allocated",
            assets.filter((asset) => asset.status === "Allocated").length,
          ],
          [
            "Needs Attention",
            assets.filter((asset) =>
              ["Under Maintenance", "Lost"].includes(asset.status),
            ).length,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[#31232e]">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[#e6dee4] bg-white shadow-sm">
        <div className="border-b border-[#e6dee4] p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <input
                className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3 outline-none focus:border-[#4f3448]"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by Asset Tag, Serial Number, QR code or asset name..."
              />
            </div>
            <button
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${showFilters ? "border-[#4f3448] bg-[#f1eaf0] text-[#4f3448]" : "border-[#ddd3da] text-slate-600"}`}
              type="button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </button>
            <button
              className="text-sm font-medium text-[#4f3448] hover:underline"
              type="button"
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>
          {showFilters && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              <FilterSelect
                name="category"
                value={filters.category}
                onChange={changeFilter}
                label="All categories"
                options={categoryOptions}
              />
              <FilterSelect
                name="status"
                value={filters.status}
                onChange={changeFilter}
                label="All statuses"
                options={statuses}
              />
              <FilterSelect
                name="department"
                value={filters.department}
                onChange={changeFilter}
                label="All departments"
                options={departments.slice(1)}
              />
              <input
                className="rounded-lg border border-[#ddd3da] px-3 py-2.5 text-sm outline-none focus:border-[#4f3448]"
                name="location"
                value={filters.location}
                onChange={changeFilter}
                placeholder="Filter by location"
              />
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e6dee4] bg-[#fcfafb] text-xs uppercase tracking-wide text-slate-500">
                {[
                  "Asset",
                  "Asset Tag / QR",
                  "Serial Number",
                  "Category",
                  "Department",
                  "Location",
                  "Condition",
                  "Lifecycle Status",
                  "Shared",
                  "Action",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.tag}
                  className="border-b border-slate-100 last:border-0 hover:bg-[#fdfbfd]"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#31232e]">{asset.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Acquired {asset.acquisitionDate}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#4f3448]">{asset.tag}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <QrCode size={12} />
                      {asset.qr}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{asset.serial}</td>
                  <td className="px-4 py-4 text-slate-600">{asset.category}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {asset.department}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {asset.location}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {asset.condition}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[asset.status]}`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {asset.shared ? "Bookable" : "No"}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      className="inline-flex items-center gap-1.5 font-medium text-[#4f3448] hover:underline"
                      type="button"
                      onClick={() => {
                        setSelectedAsset(asset);
                        setHistoryTab("allocation");
                      }}
                    >
                      <History size={16} />
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAssets.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              No assets match your search and filters.
            </p>
          )}
        </div>
      </section>

      {form && (
        <AssetForm
          form={form}
          nextTag={nextTag}
          categories={categoryOptions}
          update={updateForm}
          close={() => setForm(null)}
          submit={registerAsset}
        />
      )}
      {selectedAsset && (
        <HistoryPanel
          asset={selectedAsset}
          activeTab={historyTab}
          setActiveTab={setHistoryTab}
          close={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}

function FilterSelect({ name, value, onChange, label, options }) {
  return (
    <select
      className="rounded-lg border border-[#ddd3da] px-3 py-2.5 text-sm outline-none focus:border-[#4f3448]"
      name={name}
      value={value}
      onChange={onChange}
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function AssetForm({ form, nextTag, categories, update, close, submit }) {
  const inputClass =
    "mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448]";
  return (
    <div className="fixed inset-0 z-20 grid place-items-center overflow-y-auto bg-black/35 p-6">
      <form
        className="my-6 w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl"
        onSubmit={submit}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#31232e]">
              Register New Asset
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Asset Tag <strong className="text-[#4f3448]">{nextTag}</strong>{" "}
              will be generated automatically.
            </p>
          </div>
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            type="button"
            onClick={close}
          >
            <X size={19} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Asset Name">
            <input
              required
              className={inputClass}
              name="name"
              value={form.name}
              onChange={update}
            />
          </Field>
          <Field label="Category">
            <select
              required
              className={inputClass}
              name="category"
              value={form.category}
              onChange={update}
            >
              <option value="">Select category</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Serial Number">
            <input
              required
              className={inputClass}
              name="serial"
              value={form.serial}
              onChange={update}
            />
          </Field>
          <Field label="Acquisition Date">
            <input
              required
              className={inputClass}
              name="acquisitionDate"
              type="date"
              value={form.acquisitionDate}
              onChange={update}
            />
          </Field>
          <Field label="Acquisition Cost">
            <input
              required
              min="0"
              className={inputClass}
              name="acquisitionCost"
              type="number"
              value={form.acquisitionCost}
              onChange={update}
              placeholder="For reports and ranking only"
            />
          </Field>
          <Field label="Condition">
            <select
              className={inputClass}
              name="condition"
              value={form.condition}
              onChange={update}
            >
              {conditions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input
              required
              className={inputClass}
              name="location"
              value={form.location}
              onChange={update}
            />
          </Field>
          <Field label="Department">
            <select
              className={inputClass}
              name="department"
              value={form.department}
              onChange={update}
            >
              {departments.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Lifecycle Status">
            <select
              className={inputClass}
              name="status"
              value={form.status}
              onChange={update}
            >
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <label className="mt-7 flex h-11 items-center gap-3 rounded-lg border border-[#ddd3da] px-3 text-sm font-medium text-slate-700">
            <input
              name="shared"
              type="checkbox"
              checked={form.shared}
              onChange={update}
            />
            Shared / bookable resource
          </label>
          <UploadField
            label="Asset Photo"
            name="photo"
            accept="image/*"
            Icon={Camera}
            value={form.photo}
            update={update}
          />
          <UploadField
            label="Documents"
            name="documents"
            accept=".pdf,.doc,.docx,image/*"
            multiple
            Icon={FileText}
            value={form.documents.join(", ")}
            update={update}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-lg border border-[#ddd3da] px-4 py-2.5 text-sm font-medium text-slate-600"
            type="button"
            onClick={close}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white"
            type="submit"
          >
            Register Asset
          </button>
        </div>
      </form>
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
function UploadField({ label, name, accept, multiple, Icon, value, update }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <span className="mt-2 flex h-12 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#cdbfc9] px-3 text-sm font-normal text-slate-500">
        <Icon size={17} />
        {value || "Choose file"}
        <Upload className="ml-auto" size={16} />
      </span>
      <input
        className="hidden"
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={update}
      />
    </label>
  );
}

function HistoryPanel({ asset, activeTab, setActiveTab, close }) {
  const records =
    activeTab === "allocation"
      ? asset.allocationHistory
      : asset.maintenanceHistory;
  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/25">
      <div className="h-full w-[520px] overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[#4f3448]">{asset.tag}</p>
            <h2 className="mt-1 text-xl font-semibold text-[#31232e]">
              {asset.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {asset.serial} · {asset.status}
            </p>
          </div>
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            type="button"
            onClick={close}
          >
            <X size={19} />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-[#f8f5f7] p-4">
          <Info label="Category" value={asset.category} />
          <Info label="Department" value={asset.department} />
          <Info label="Location" value={asset.location} />
          <Info label="Condition" value={asset.condition} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-[#f3edf1] p-1">
          <button
            className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === "allocation" ? "bg-white text-[#4f3448] shadow-sm" : "text-slate-500"}`}
            type="button"
            onClick={() => setActiveTab("allocation")}
          >
            Allocation History
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === "maintenance" ? "bg-white text-[#4f3448] shadow-sm" : "text-slate-500"}`}
            type="button"
            onClick={() => setActiveTab("maintenance")}
          >
            Maintenance History
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {records.map((record, index) => (
            <div
              key={`${record.event}-${index}`}
              className="relative border-l-2 border-[#d9ccd5] pb-5 pl-5 last:pb-0"
            >
              <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-[#4f3448]" />
              <p className="font-medium text-[#31232e]">{record.event}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays size={13} />
                {record.date}
              </p>
              <p className="mt-2 text-sm text-slate-600">{record.detail}</p>
            </div>
          ))}
          {records.length === 0 && (
            <p className="rounded-lg bg-slate-50 py-10 text-center text-sm text-slate-500">
              No history recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#31232e]">{value}</p>
    </div>
  );
}
