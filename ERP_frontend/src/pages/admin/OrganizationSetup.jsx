import { useEffect, useState } from "react";
import {
  Building2,
  FolderTree,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
} from "lucide-react";

const initialDepartments = [
  {
    id: "DEP-001",
    name: "Information Technology",
    head: "Rahul Verma",
    parent: "Corporate Services",
    status: "Active",
  },
  {
    id: "DEP-002",
    name: "Human Resources",
    head: "Ananya Mehta",
    parent: "Corporate Services",
    status: "Active",
  },
  {
    id: "DEP-003",
    name: "Finance",
    head: "Neha Kapoor",
    parent: "Corporate Services",
    status: "Active",
  },
  {
    id: "DEP-004",
    name: "Operations",
    head: "Amit Patel",
    parent: "—",
    status: "Active",
  },
];

const initialCategories = [
  {
    id: "CAT-001",
    name: "Electronics",
    fields: "Warranty period, Serial number",
    assets: 486,
    status: "Active",
  },
  {
    id: "CAT-002",
    name: "Furniture",
    fields: "Material, Dimensions",
    assets: 318,
    status: "Active",
  },
  {
    id: "CAT-003",
    name: "Vehicles",
    fields: "Registration number, Insurance expiry",
    assets: 42,
    status: "Active",
  },
  {
    id: "CAT-004",
    name: "Office Equipment",
    fields: "Model, Service interval",
    assets: 175,
    status: "Active",
  },
];

const initialEmployees = [
  {
    id: "EMP001",
    name: "Priya Sharma",
    email: "priya@assetflow.com",
    department: "Information Technology",
    role: "EMPLOYEE",
    status: "Active",
  },
  {
    id: "EMP002",
    name: "Rahul Verma",
    email: "rahul@assetflow.com",
    department: "Information Technology",
    role: "DEPARTMENT_HEAD",
    status: "Active",
  },
  {
    id: "EMP003",
    name: "Amit Patel",
    email: "amit@assetflow.com",
    department: "Operations",
    role: "ASSET_MANAGER",
    status: "Active",
  },
  {
    id: "EMP004",
    name: "Neha Kapoor",
    email: "neha@assetflow.com",
    department: "Finance",
    role: "EMPLOYEE",
    status: "Inactive",
  },
];

const tabs = [
  { id: "departments", label: "Department Management", Icon: Building2 },
  { id: "categories", label: "Asset Categories", Icon: FolderTree },
  { id: "employees", label: "Employee Directory", Icon: Users },
];

const emptyForms = {
  departments: { name: "", head: "", parent: "", status: "Active" },
  categories: { name: "", fields: "", status: "Active" },
  employees: {
    name: "",
    email: "",
    department: "",
    role: "EMPLOYEE",
    status: "Active",
  },
};

const readStored = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const getDirectoryEmployees = () => {
  const saved = readStored("assetflow_employees", initialEmployees);
  const registered = readStored("assetflow_registered_users", []);
  const merged = [...saved];
  registered.forEach((user) => {
    if (!merged.some((item) => item.email?.toLowerCase() === user.email.toLowerCase())) {
      merged.push({ id: user.employeeId, name: user.fullName, email: user.email, department: user.department || "Unassigned", role: user.role || "EMPLOYEE", status: "Active" });
    }
  });
  return merged;
};

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState("departments");
  const [departments, setDepartments] = useState(() => readStored("assetflow_departments", initialDepartments));
  const [categories, setCategories] = useState(() => {
    try {
      return readStored("assetflow_categories", initialCategories);
    } catch {
      return initialCategories;
    }
  });
  const [employees, setEmployees] = useState(getDirectoryEmployees);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem("assetflow_categories", JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem("assetflow_departments", JSON.stringify(departments));
  }, [departments]);
  useEffect(() => {
    localStorage.setItem("assetflow_employees", JSON.stringify(employees));
  }, [employees]);

  const syncEmployeeAccount = (employee) => {
    const registered = readStored("assetflow_registered_users", []);
    localStorage.setItem("assetflow_registered_users", JSON.stringify(registered.map((user) => user.email.toLowerCase() === employee.email.toLowerCase() ? { ...user, fullName: employee.name, department: employee.department, role: employee.role } : user)));
    const session = readStored("assetflow_user", null);
    if (session?.email?.toLowerCase() === employee.email.toLowerCase()) {
      localStorage.setItem("assetflow_user", JSON.stringify({ ...session, fullName: employee.name, department: employee.department, role: employee.role }));
    }
  };

  const data =
    activeTab === "departments"
      ? departments
      : activeTab === "categories"
        ? categories
        : employees;
  const filtered = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForms[activeTab] });
  };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...item });
  };
  const closeForm = () => {
    setForm(null);
    setEditingId(null);
  };
  const updateForm = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const save = (event) => {
    event.preventDefault();
    if (activeTab === "departments") {
      const item = {
        ...form,
        id:
          editingId || `DEP-${String(departments.length + 1).padStart(3, "0")}`,
      };
      setDepartments(
        editingId
          ? departments.map((row) => (row.id === editingId ? item : row))
          : [...departments, item],
      );
    } else if (activeTab === "categories") {
      const item = {
        ...form,
        id:
          editingId || `CAT-${String(categories.length + 1).padStart(3, "0")}`,
        assets: form.assets || 0,
      };
      setCategories(
        editingId
          ? categories.map((row) => (row.id === editingId ? item : row))
          : [...categories, item],
      );
    } else {
      const item = {
        ...form,
        id: editingId || `EMP${String(employees.length + 1).padStart(3, "0")}`,
      };
      setEmployees(
        editingId
          ? employees.map((row) => (row.id === editingId ? item : row))
          : [...employees, item],
      );
      syncEmployeeAccount(item);
    }
    closeForm();
  };

  const toggleStatus = (id) => {
    const toggle = (rows) =>
      rows.map((row) =>
        row.id === id
          ? { ...row, status: row.status === "Active" ? "Inactive" : "Active" }
          : row,
      );
    if (activeTab === "departments") setDepartments(toggle(departments));
    else if (activeTab === "categories") setCategories(toggle(categories));
    else {
      const updated = toggle(employees);
      setEmployees(updated);
      const changed = updated.find((item) => item.id === id);
      if (changed) syncEmployeeAccount(changed);
    }
  };

  const title =
    activeTab === "departments"
      ? "Departments"
      : activeTab === "categories"
        ? "Asset Categories"
        : "Employees";
  const descriptions = {
    departments:
      "Create department hierarchy, assign Department Heads and control active status.",
    categories:
      "Maintain asset categories and optional category-specific information fields.",
    employees:
      "Manage employee department, role and status. Administrative roles can only be assigned here.",
  };

  return (
    <div className="space-y-6">
      

      <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#e6dee4] bg-white p-2 shadow-sm">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${activeTab === id ? "bg-[#4f3448] text-white" : "text-slate-600 hover:bg-[#f7f3f6]"}`}
            type="button"
            onClick={() => {
              setActiveTab(id);
              setSearch("");
              closeForm();
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-[#e6dee4] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e6dee4] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#31232e]">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {descriptions[activeTab]}
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3e2939]"
            type="button"
            onClick={openCreate}
          >
            <Plus size={18} />
            Add{" "}
            {activeTab === "departments"
              ? "Department"
              : activeTab === "categories"
                ? "Category"
                : "Employee"}
          </button>
        </div>
        <div className="p-5">
          <div className="relative mb-5 w-full max-w-md">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3 outline-none focus:border-[#4f3448]"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
            />
          </div>
          {activeTab === "departments" && (
            <DataTable
              headers={[
                "Department ID",
                "Department",
                "Department Head",
                "Parent Department",
                "Status",
                "Actions",
              ]}
              rows={filtered}
              cells={(item) => [
                item.id,
                item.name,
                item.head || "Not assigned",
                item.parent || "—",
              ]}
              onEdit={openEdit}
              onToggle={toggleStatus}
            />
          )}
          {activeTab === "categories" && (
            <DataTable
              headers={[
                "Category ID",
                "Category",
                "Category-specific Fields",
                "Assets",
                "Status",
                "Actions",
              ]}
              rows={filtered}
              cells={(item) => [
                item.id,
                item.name,
                item.fields || "No custom fields",
                item.assets,
              ]}
              onEdit={openEdit}
              onToggle={toggleStatus}
            />
          )}
          {activeTab === "employees" && (
            <DataTable
              headers={[
                "Employee ID",
                "Employee",
                "Email",
                "Department",
                "Role",
                "Status",
                "Actions",
              ]}
              rows={filtered}
              cells={(item) => [
                item.id,
                item.name,
                item.email,
                item.department,
                <span
                  key={item.id}
                  className="rounded-full bg-[#f1eaf0] px-2.5 py-1 text-xs font-semibold text-[#4f3448]"
                >
                  {item.role.replaceAll("_", " ")}
                </span>,
              ]}
              onEdit={openEdit}
              onToggle={toggleStatus}
            />
          )}
        </div>
      </section>

      {form && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/30 p-6">
          <form
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onSubmit={save}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#31232e]">
                  {editingId ? "Edit" : "Add"}{" "}
                  {activeTab === "departments"
                    ? "Department"
                    : activeTab === "categories"
                      ? "Category"
                      : "Employee"}
                </h2>
                {activeTab === "employees" && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#7a6475]">
                    <ShieldCheck size={14} />
                    Roles assigned here control module access.
                  </p>
                )}
              </div>
              <button
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                type="button"
                onClick={closeForm}
              >
                <X size={19} />
              </button>
            </div>
            <SetupFields
              tab={activeTab}
              form={form}
              departments={departments}
              employees={employees}
              update={updateForm}
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-[#ddd3da] px-4 py-2 text-sm font-medium text-slate-600"
                type="button"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#4f3448] px-4 py-2 text-sm font-medium text-white"
                type="submit"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function DataTable({ headers, rows, cells, onEdit, onToggle }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#e6dee4] text-xs uppercase tracking-wide text-slate-500">
            {headers.map((header) => (
              <th key={header} className="px-3 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr
              key={item.id}
              className="border-b border-slate-100 last:border-0"
            >
              {cells(item).map((cell, index) => (
                <td key={index} className="px-3 py-4 text-slate-600">
                  {index === 0 ? (
                    <span className="font-semibold text-[#4f3448]">{cell}</span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
              <td className="px-3 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-3 py-4">
                <div className="flex gap-2">
                  <button
                    aria-label="Edit"
                    className="rounded-lg border border-[#e6dee4] p-2 text-[#4f3448] hover:bg-[#f7f3f6]"
                    type="button"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label="Toggle status"
                    className="rounded-lg border border-[#e6dee4] p-2 text-slate-600 hover:bg-[#f7f3f6]"
                    type="button"
                    onClick={() => onToggle(item.id)}
                  >
                    {item.status === "Active" ? (
                      <ToggleRight size={18} />
                    ) : (
                      <ToggleLeft size={18} />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">
          No matching records found.
        </p>
      )}
    </div>
  );
}

function SetupFields({ tab, form, departments, employees, update }) {
  const inputClass =
    "mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448]";
  if (tab === "departments")
    return (
      <div className="space-y-4">
        <Field label="Department Name">
          <input
            required
            className={inputClass}
            name="name"
            value={form.name}
            onChange={update}
          />
        </Field>
        <Field label="Department Head">
          <select
            className={inputClass}
            name="head"
            value={form.head}
            onChange={update}
          >
            <option value="">Not assigned</option>
            {employees.map((item) => (
              <option key={item.id}>{item.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Parent Department (optional)">
          <select
            className={inputClass}
            name="parent"
            value={form.parent}
            onChange={update}
          >
            <option value="">No parent department</option>
            {departments
              .filter((item) => item.name !== form.name)
              .map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
          </select>
        </Field>
        <StatusField
          value={form.status}
          update={update}
          className={inputClass}
        />
      </div>
    );
  if (tab === "categories")
    return (
      <div className="space-y-4">
        <Field label="Category Name">
          <input
            required
            className={inputClass}
            name="name"
            value={form.name}
            onChange={update}
          />
        </Field>
        <Field label="Category-specific Fields (optional)">
          <input
            className={inputClass}
            name="fields"
            value={form.fields}
            onChange={update}
            placeholder="e.g. Warranty period, Serial number"
          />
        </Field>
        <StatusField
          value={form.status}
          update={update}
          className={inputClass}
        />
      </div>
    );
  return (
    <div className="space-y-4">
      <Field label="Full Name">
        <input
          required
          className={inputClass}
          name="name"
          value={form.name}
          onChange={update}
        />
      </Field>
      <Field label="Email">
        <input
          required
          className={inputClass}
          name="email"
          type="email"
          value={form.email}
          onChange={update}
        />
      </Field>
      <Field label="Department">
        <select
          required
          className={inputClass}
          name="department"
          value={form.department}
          onChange={update}
        >
          <option value="">Select department</option>
          {departments.map((item) => (
            <option key={item.id}>{item.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Role">
        <select
          className={inputClass}
          name="role"
          value={form.role}
          onChange={update}
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="DEPARTMENT_HEAD">Department Head</option>
          <option value="ASSET_MANAGER">Asset Manager</option>
        </select>
      </Field>
      <StatusField value={form.status} update={update} className={inputClass} />
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
function StatusField({ value, update, className }) {
  return (
    <Field label="Status">
      <select
        className={className}
        name="status"
        value={value}
        onChange={update}
      >
        <option>Active</option>
        <option>Inactive</option>
      </select>
    </Field>
  );
}
