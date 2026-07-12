import { useMemo, useState } from "react";
import { Boxes, Eye, Search, UserCheck, Users, X } from "lucide-react";
import useAuth from "../../hooks/useAuth";

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

export default function DepartmentAssets() {
  const { user } = useAuth();
  const department = user?.department || "Unassigned";
  const [tab, setTab] = useState("assets");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const assets = read("assetflow_assets").filter(
    (item) => item.department === department,
  );
  const employees = read("assetflow_employees").filter(
    (item) => item.department === department,
  );
  const allocations = read("assetflow_allocations").filter(
    (item) => item.department === department && item.status === "Active",
  );
  const rows = useMemo(
    () =>
      (tab === "assets" ? assets : employees).filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [tab, search, assets, employees],
  );

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-sm font-medium text-[#7a6475]">{department}</p>
        <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
          Department Assets & Employees
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          View only the assets and employees belonging to your department.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          ["Department Assets", assets.length, Boxes],
          [
            "Allocated Assets",
            assets.filter((item) => item.status === "Allocated").length,
            UserCheck,
          ],
          ["Department Employees", employees.length, Users],
          ["Active Allocations", allocations.length, Boxes],
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
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#e6dee4] bg-white p-2">
        <button
          className={`rounded-lg px-4 py-3 text-sm font-semibold ${tab === "assets" ? "bg-[#4f3448] text-white" : "text-slate-600"}`}
          onClick={() => setTab("assets")}
        >
          Department Assets
        </button>
        <button
          className={`rounded-lg px-4 py-3 text-sm font-semibold ${tab === "employees" ? "bg-[#4f3448] text-white" : "text-slate-600"}`}
          onClick={() => setTab("employees")}
        >
          Department Employees
        </button>
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
              placeholder={`Search department ${tab}...`}
            />
          </div>
        </div>
        {tab === "assets" ? (
          <AssetTable
            rows={rows}
            allocations={allocations}
            view={setSelected}
          />
        ) : (
          <EmployeeTable rows={rows} />
        )}
      </section>
      {selected && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/25">
          <div className="h-full w-[500px] overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-[#4f3448]">{selected.tag}</p>
                <h2 className="text-xl font-semibold text-[#31232e]">
                  {selected.name}
                </h2>
              </div>
              <button onClick={() => setSelected(null)}>
                <X size={19} />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg bg-[#f8f5f7] p-4">
              {[
                ["Category", selected.category],
                ["Status", selected.status],
                ["Location", selected.location],
                ["Condition", selected.condition],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-medium">
                    {value || "Not set"}
                  </p>
                </div>
              ))}
            </div>
            <h3 className="mt-6 font-semibold">
              Allocation & Maintenance History
            </h3>
            <div className="mt-3 space-y-3">
              {[
                ...(selected.allocationHistory || []),
                ...(selected.maintenanceHistory || []),
              ].map((item, index) => (
                <div key={index} className="border-l-2 border-[#d9ccd5] pl-4">
                  <p className="text-sm font-medium">{item.event}</p>
                  <p className="text-xs text-slate-500">
                    {item.date} · {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetTable({ rows, allocations, view }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
            {[
              "Asset Tag",
              "Asset",
              "Category",
              "Location",
              "Current Holder",
              "Condition",
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
          {rows.map((item) => {
            const allocation = allocations.find(
              (row) => row.assetTag === item.tag,
            );
            return (
              <tr key={item.tag} className="border-b border-slate-100">
                <td className="px-4 py-4 font-semibold text-[#4f3448]">
                  {item.tag}
                </td>
                <td className="px-4 py-4 font-medium">{item.name}</td>
                <td className="px-4 py-4 text-slate-600">{item.category}</td>
                <td className="px-4 py-4 text-slate-600">{item.location}</td>
                <td className="px-4 py-4 text-slate-600">
                  {allocation?.holder || item.holder || "Unassigned"}
                </td>
                <td className="px-4 py-4 text-slate-600">{item.condition}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-[#f1eaf0] px-2.5 py-1 text-xs font-semibold text-[#4f3448]">
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    className="inline-flex items-center gap-1 font-medium text-[#4f3448] hover:underline"
                    onClick={() => view(item)}
                  >
                    <Eye size={15} />
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function EmployeeTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
            {["Employee ID", "Name", "Email", "Role", "Status"].map((item) => (
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
              </td>
              <td className="px-4 py-4 font-medium">{item.name}</td>
              <td className="px-4 py-4 text-slate-600">{item.email}</td>
              <td className="px-4 py-4 text-slate-600">
                {item.role.replaceAll("_", " ")}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
