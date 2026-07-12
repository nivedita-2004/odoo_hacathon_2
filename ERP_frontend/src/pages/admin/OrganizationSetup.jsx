import { useEffect, useState, useRef } from "react";
import {
  Building2, FolderTree, Pencil, Plus, Search, ShieldCheck,
  ToggleLeft, ToggleRight, Users, X, MapPin, Shield, Check, Palette, Bell
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/apis";

const tabs = [
  { id: "branches", label: "Branch Management", Icon: MapPin },
  { id: "departments", label: "Department Management", Icon: Building2 },
  { id: "categories", label: "Asset Categories", Icon: FolderTree },
  { id: "employees", label: "Employee Directory", Icon: Users },
  { id: "roles", label: "Roles & Permissions", Icon: Shield },
  { id: "permissions", label: "Custom Permissions", Icon: ShieldCheck },
  { id: "branding", label: "Branding", Icon: Palette },
  { id: "notifications", label: "Notification Rules", Icon: Bell },
];

const emptyForms = {
  branches: { name: "", city: "", address: "", status: "Active" },
  departments: { name: "", branch_id: "", head_id: "", status: "Active" },
  categories: { name: "", fields: "", status: "Active" },
  employees: { name: "", email: "", department_id: "", role: "EMPLOYEE", status: "Active" },
  roles: { name: "", description: "", status: "Active", permissions: [] },
  permissions: { name: "", description: "" },
  notifications: { name: "", event_trigger: "", channel: "Email", subject_template: "", body_template: "" }
};

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState("branches");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupData, setSetupData] = useState({
    branches: [], departments: [], categories: [], employees: [],
    roles: [], permissions: [], branding: { logo_url: '', brand_color: '' }, notifications: []
  });

  const fetchSetup = async () => {
    try {
      const token = localStorage.getItem("assetflow_token");
      const [res1, res2] = await Promise.all([
        fetch(API_ENDPOINTS.ORGANIZATION.SETUP, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(API_ENDPOINTS.ORGANIZATION.SAAS_SETUP, { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      const result1 = await res1.json();
      const result2 = await res2.json();
      if (result1.success && result2.success) {
        setSetupData({ ...result1.data, ...result2.data });
      } else {
        setError(result1.error || result2.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetup();
  }, []);

  const data = setupData[activeTab] || [];
  const filtered = Array.isArray(data) ? data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase()),
    )
  ) : [];

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
  const updateForm = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const updateCheckbox = (permId) => {
    const perms = form.permissions || [];
    if (perms.includes(permId)) {
      setForm({ ...form, permissions: perms.filter(p => p !== permId) });
    } else {
      setForm({ ...form, permissions: [...perms, permId] });
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const endpointMap = {
      branches: API_ENDPOINTS.ORGANIZATION.BRANCHES,
      departments: API_ENDPOINTS.ORGANIZATION.DEPARTMENTS,
      categories: API_ENDPOINTS.ORGANIZATION.CATEGORIES,
      employees: API_ENDPOINTS.ORGANIZATION.EMPLOYEES,
      roles: API_ENDPOINTS.ORGANIZATION.ROLES,
      permissions: API_ENDPOINTS.ORGANIZATION.PERMISSIONS,
      notifications: API_ENDPOINTS.ORGANIZATION.NOTIFICATIONS,
    };

    try {
      const token = localStorage.getItem("assetflow_token");
      const res = await fetch(endpointMap[activeTab], {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, id: editingId })
      });
      const result = await res.json();
      if (result.success) {
        await fetchSetup();
        closeForm();
      } else {
        alert(result.error || 'Failed to save');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const saveBranding = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem("assetflow_token");
      const formData = new FormData();
      formData.append('brand_color', setupData.branding.brand_color);
      if (setupData.branding.file) {
        formData.append('logo', setupData.branding.file);
      } else {
        formData.append('logo_url', setupData.branding.logo_url);
      }

      const res = await fetch(API_ENDPOINTS.ORGANIZATION.BRANDING, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        alert('Branding saved successfully!');
        await fetchSetup();
      } else {
        alert(result.error || 'Failed to save branding');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    const endpointMap = {
      branches: API_ENDPOINTS.ORGANIZATION.BRANCHES,
      departments: API_ENDPOINTS.ORGANIZATION.DEPARTMENTS,
      categories: API_ENDPOINTS.ORGANIZATION.CATEGORIES,
      employees: API_ENDPOINTS.ORGANIZATION.EMPLOYEES,
      roles: API_ENDPOINTS.ORGANIZATION.ROLES,
    };

    const item = setupData[activeTab].find(i => i.id === id);

    try {
      const token = localStorage.getItem("assetflow_token");
      const res = await fetch(endpointMap[activeTab], {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...item, status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        await fetchSetup();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const title = tabs.find(t => t.id === activeTab)?.label;
  const descriptions = {
    branches: "Manage physical or regional branches of your organization.",
    departments: "Create department hierarchy and assign Department Heads.",
    categories: "Maintain asset categories and optional category-specific fields.",
    employees: "Manage employee roles, departments, and active statuses.",
    roles: "Create custom roles and assign granular permissions.",
    permissions: "Create new custom permissions to use in the Roles matrix.",
    branding: "Customize the look and feel of AssetFlow for your employees.",
    notifications: "Configure global notification rules and templates.",
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-slate-500">Loading setup data...</div>;
  if (error) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6 pb-10" style={{ '--brand-color': setupData.branding?.brand_color || '#4f3448' }}>
      <div className="grid grid-cols-4 gap-3 rounded-sm border border-gray-200 bg-white p-2 shadow-sm">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`flex items-center justify-center gap-2 rounded-sm px-4 py-3 text-[13px] font-semibold transition-colors ${activeTab === id ? "bg-[var(--brand-color)] text-white" : "text-slate-600 hover:bg-gray-50"}`}
            type="button"
            onClick={() => {
              setActiveTab(id);
              setSearch("");
              closeForm();
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <section className="rounded-sm border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-lg font-bold text-[#31232e]">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{descriptions[activeTab]}</p>
          </div>
          {activeTab !== "branding" && (
            <button
              className="inline-flex items-center gap-2 rounded-sm bg-[var(--brand-color)] px-4 py-2.5 text-[13px] font-semibold tracking-wide text-white transition-opacity hover:opacity-90"
              type="button"
              onClick={openCreate}
            >
              <Plus size={16} /> Add {title.split(' ')[0]}
            </button>
          )}
        </div>
        
        <div className="p-6">
          {activeTab !== "branding" && (
            <div className="relative mb-6 w-full max-w-md">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                className="w-full rounded-sm border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-[var(--brand-color)]"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${title.toLowerCase()}...`}
              />
            </div>
          )}
          
          {activeTab === "branches" && (
            <DataTable headers={["Branch Name", "City", "Address", "Status", "Actions"]} rows={filtered} cells={(item) => [item.name, item.city || "—", item.address || "—"]} onEdit={openEdit} onToggle={toggleStatus} />
          )}
          {activeTab === "departments" && (
            <DataTable headers={["Department", "Branch", "Department Head", "Status", "Actions"]} rows={filtered} cells={(item) => [item.name, item.branch || "—", item.head || "Not assigned"]} onEdit={openEdit} onToggle={toggleStatus} />
          )}
          {activeTab === "categories" && (
            <DataTable headers={["Category", "Category-specific Fields", "Status", "Actions"]} rows={filtered} cells={(item) => [item.name, item.fields || "No custom fields"]} onEdit={openEdit} onToggle={toggleStatus} />
          )}
          {activeTab === "employees" && (
            <DataTable headers={["Employee", "Email", "Department", "Role", "Status", "Actions"]} rows={filtered} cells={(item) => [
              item.name, item.email, item.department || "—",
              <span key={item.id} className="rounded-sm bg-gray-50 border border-gray-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#4f3448]">{(item.role || 'EMPLOYEE').replaceAll("_", " ")}</span>
            ]} onEdit={openEdit} onToggle={toggleStatus} />
          )}
          {activeTab === "roles" && (
            <DataTable headers={["Role Name", "Description", "Permissions", "Status", "Actions"]} rows={filtered} cells={(item) => [
              item.name, item.description || "—",
              <span key={item.id} className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-sm">{item.permissions?.length || 0} permissions</span>
            ]} onEdit={openEdit} onToggle={toggleStatus} />
          )}
          {activeTab === "permissions" && (
            <DataTable headers={["Permission Key", "Description", "Actions"]} rows={filtered} cells={(item) => [
              <span key={item.id} className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-100 px-2 py-1 rounded">{item.name}</span>,
              item.description || "—"
            ]} onEdit={openEdit} />
          )}
          {activeTab === "notifications" && (
            <DataTable headers={["Rule Name", "Event Trigger", "Channel", "Actions"]} rows={filtered} cells={(item) => [
              item.name, item.event_trigger || "—", 
              <span key={item.id} className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-sm">{item.channel}</span>
            ]} onEdit={openEdit} />
          )}
          
          {activeTab === "branding" && (
            <form onSubmit={saveBranding} className="max-w-2xl space-y-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-10">
                {setupData.branding.logo_url || setupData.branding.file ? (
                  <img src={setupData.branding.file ? URL.createObjectURL(setupData.branding.file) : setupData.branding.logo_url} alt="Logo Preview" className="h-20 object-contain mb-4" />
                ) : (
                  <div className="h-20 w-20 bg-gray-50 flex items-center justify-center rounded-full mb-4">
                    <Palette className="text-gray-400" size={32} />
                  </div>
                )}
                <label className="cursor-pointer bg-white border border-gray-200 text-sm font-semibold text-slate-700 px-4 py-2 rounded-sm shadow-sm hover:bg-gray-50">
                  Upload Logo (Cloudinary)
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setSetupData({...setupData, branding: {...setupData.branding, file: e.target.files[0]}})} />
                </label>
                <p className="text-xs text-slate-400 mt-3">Or paste a URL below</p>
                <input 
                  className="mt-2 w-full max-w-sm rounded-sm border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-color)] text-center"
                  placeholder="https://example.com/logo.png"
                  value={setupData.branding.logo_url || ''}
                  onChange={(e) => setSetupData({...setupData, branding: {...setupData.branding, logo_url: e.target.value}})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Brand Color</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    className="h-10 w-20 rounded cursor-pointer border-0 p-0"
                    value={setupData.branding.brand_color || '#4f3448'}
                    onChange={(e) => setSetupData({...setupData, branding: {...setupData.branding, brand_color: e.target.value}})}
                  />
                  <input 
                    type="text" 
                    className="w-32 rounded-sm border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--brand-color)]"
                    value={setupData.branding.brand_color || '#4f3448'}
                    onChange={(e) => setSetupData({...setupData, branding: {...setupData.branding, brand_color: e.target.value}})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  className="rounded-sm bg-[var(--brand-color)] px-6 py-2.5 text-sm font-semibold tracking-wide text-white transition-opacity hover:opacity-90"
                  type="submit"
                >
                  Save Branding Preferences
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {form && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-6 backdrop-blur-sm overflow-y-auto">
          <form className="w-full max-w-lg rounded-sm bg-white p-8 shadow-xl my-8" onSubmit={save}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#31232e]">
                  {editingId ? "Edit" : "Add"} {title.split(' ')[0]}
                </h2>
              </div>
              <button className="rounded-sm p-2 text-slate-400 transition-colors hover:bg-gray-50 hover:text-slate-600" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>
            
            <SetupFields tab={activeTab} form={form} update={updateForm} updateCheckbox={updateCheckbox} setupData={setupData} />
            
            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button className="rounded-sm border border-gray-200 px-5 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-gray-50" type="button" onClick={closeForm}>Cancel</button>
              <button className="rounded-sm bg-[var(--brand-color)] px-5 py-2.5 text-[13px] font-semibold tracking-wide text-white transition-opacity hover:opacity-90" type="submit">Save Changes</button>
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
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {headers.map((header) => <th key={header} className="px-3 py-4">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50/50">
              {cells(item).map((cell, index) => (
                <td key={index} className="px-3 py-4 text-sm text-slate-600">
                  {index === 0 ? <span className="font-semibold text-[#4f3448]">{cell}</span> : cell}
                </td>
              ))}
              {item.status && (
                <td className="px-3 py-4">
                  <span className={`rounded-sm px-2.5 py-1 text-[11px] font-bold tracking-wide ${item.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {item.status}
                  </span>
                </td>
              )}
              <td className="px-3 py-4">
                <div className="flex gap-2">
                  {onEdit && (
                    <button aria-label="Edit" className="rounded-sm border border-gray-200 p-2 text-[var(--brand-color)] transition-colors hover:bg-gray-50" type="button" onClick={() => onEdit(item)}>
                      <Pencil size={15} />
                    </button>
                  )}
                  {onToggle && (
                    <button aria-label="Toggle status" className="rounded-sm border border-gray-200 p-2 text-slate-500 transition-colors hover:bg-gray-50" type="button" onClick={() => onToggle(item.id, item.status)}>
                      {item.status === "Active" ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-12 text-center text-sm font-medium text-slate-500">No matching records found.</p>}
    </div>
  );
}

function SetupFields({ tab, form, update, updateCheckbox, setupData }) {
  const inputClass = "mt-2 w-full rounded-sm border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--brand-color)]";
  
  if (tab === "roles") return (
    <div className="space-y-4">
      <Field label="Role Name"><input required className={inputClass} name="name" value={form.name || ''} onChange={update} placeholder="e.g. Regional Manager" /></Field>
      <Field label="Description"><input className={inputClass} name="description" value={form.description || ''} onChange={update} /></Field>
      <div className="pt-4 pb-2 border-b border-gray-100">
        <label className="block text-sm font-bold text-slate-700 mb-4">Assign Permissions</label>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {setupData.permissions.map(p => (
            <label key={p.id} className="flex items-start gap-3 cursor-pointer group">
              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${form.permissions?.includes(p.id) ? 'border-[var(--brand-color)] bg-[var(--brand-color)] text-white' : 'border-gray-300 bg-white group-hover:border-[var(--brand-color)]'}`}>
                {form.permissions?.includes(p.id) && <Check size={12} strokeWidth={3} />}
              </div>
              <input type="checkbox" className="hidden" checked={form.permissions?.includes(p.id)} onChange={() => updateCheckbox(p.id)} />
              <div>
                <p className="text-sm font-semibold text-slate-700">{p.name}</p>
                <p className="text-[11px] text-slate-500">{p.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      <StatusField value={form.status} update={update} className={inputClass} />
    </div>
  );

  if (tab === "permissions") return (
    <div className="space-y-4">
      <Field label="Permission Key (snake_case)"><input required className={inputClass} name="name" value={form.name || ''} onChange={update} placeholder="e.g. manage_vendors" /></Field>
      <Field label="Description"><input required className={inputClass} name="description" value={form.description || ''} onChange={update} placeholder="e.g. Can add and edit external vendors" /></Field>
    </div>
  );

  if (tab === "notifications") return (
    <div className="space-y-4">
      <Field label="Rule Name"><input required className={inputClass} name="name" value={form.name || ''} onChange={update} placeholder="e.g. Asset Assignment Alert" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Event Trigger">
          <select required className={inputClass} name="event_trigger" value={form.event_trigger || ''} onChange={update}>
            <option value="">Select event...</option>
            <option value="ASSET_ASSIGNED">Asset Assigned</option>
            <option value="ASSET_RETURNED">Asset Returned</option>
            <option value="MAINTENANCE_REQUESTED">Maintenance Requested</option>
            <option value="APPROVAL_NEEDED">Approval Needed</option>
          </select>
        </Field>
        <Field label="Channel">
          <select required className={inputClass} name="channel" value={form.channel || 'Email'} onChange={update}>
            <option value="Email">Email</option>
            <option value="Slack">Slack / Teams</option>
            <option value="In-App">In-App Only</option>
          </select>
        </Field>
      </div>
      <Field label="Subject Template"><input className={inputClass} name="subject_template" value={form.subject_template || ''} onChange={update} placeholder="e.g. You have been assigned: {{asset_name}}" /></Field>
      <Field label="Body Template">
        <textarea required className={inputClass} name="body_template" value={form.body_template || ''} onChange={update} rows={4} placeholder="Hello {{user_name}},\n\nYou have received {{asset_name}}." />
      </Field>
    </div>
  );
  
  if (tab === "branches") return (
    <div className="space-y-4">
      <Field label="Branch Name"><input required className={inputClass} name="name" value={form.name || ''} onChange={update} placeholder="e.g. Headquarters" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="City"><input className={inputClass} name="city" value={form.city || ''} onChange={update} placeholder="e.g. New York" /></Field>
        <Field label="Address"><input className={inputClass} name="address" value={form.address || ''} onChange={update} placeholder="Street address" /></Field>
      </div>
      <StatusField value={form.status} update={update} className={inputClass} />
    </div>
  );
  
  if (tab === "departments") return (
    <div className="space-y-4">
      <Field label="Department Name"><input required className={inputClass} name="name" value={form.name || ''} onChange={update} /></Field>
      <Field label="Branch Location">
        <select required className={inputClass} name="branch_id" value={form.branch_id || ''} onChange={update}>
          <option value="">Select branch</option>
          {setupData.branches.filter(b => b.status === 'Active').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </Field>
      <Field label="Department Head">
        <select className={inputClass} name="head_id" value={form.head_id || ''} onChange={update}>
          <option value="">Not assigned</option>
          {setupData.employees.filter(e => e.status === 'Active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </Field>
      <StatusField value={form.status} update={update} className={inputClass} />
    </div>
  );

  if (tab === "categories") return (
    <div className="space-y-4">
      <Field label="Category Name"><input required className={inputClass} name="name" value={form.name || ''} onChange={update} /></Field>
      <Field label="Category-specific Fields (optional)"><input className={inputClass} name="fields" value={form.fields || ''} onChange={update} placeholder="e.g. Warranty period, Serial number" /></Field>
      <StatusField value={form.status} update={update} className={inputClass} />
    </div>
  );
  
  if (tab === "employees") return (
    <div className="space-y-4">
      <Field label="Full Name"><input required className={inputClass} name="name" value={form.name || ''} onChange={update} /></Field>
      <Field label="Email"><input required className={inputClass} name="email" type="email" value={form.email || ''} onChange={update} /></Field>
      <Field label="Department">
        <select required className={inputClass} name="department_id" value={form.department_id || ''} onChange={update}>
          <option value="">Select department</option>
          {setupData.departments.filter(d => d.status === 'Active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </Field>
      <Field label="Role">
        <select className={inputClass} name="role" value={form.role || 'EMPLOYEE'} onChange={update}>
          <option value="EMPLOYEE">Employee</option>
          {setupData.roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
      </Field>
      <StatusField value={form.status} update={update} className={inputClass} />
    </div>
  );
}

function Field({ label, children }) { return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>; }
function StatusField({ value, update, className }) {
  return <Field label="Status"><select className={className} name="status" value={value} onChange={update}><option>Active</option><option>Inactive</option></select></Field>;
}
