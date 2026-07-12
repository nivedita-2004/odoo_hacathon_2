import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, PackageOpen, Wrench, ArrowRightLeft, Users, FileBarChart, ClipboardCheck } from "lucide-react";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const routes = [
    { label: "Dashboard", path: "/", icon: <FileBarChart size={18} /> },
    { label: "Asset Inventory", path: "/admin/assets", icon: <PackageOpen size={18} /> },
    { label: "Organization Setup", path: "/admin/organization-setup", icon: <Building2 size={18} /> },
    { label: "Allocations & Transfers", path: "/admin/allocations-transfers", icon: <ArrowRightLeft size={18} /> },
    { label: "Maintenance Requests", path: "/admin/maintenance", icon: <Wrench size={18} /> },
    { label: "Audit Cycles", path: "/admin/audits", icon: <ClipboardCheck size={18} /> },
    { label: "Employee Directory", path: "/admin/organization-setup", icon: <Users size={18} /> },
  ];

  const filteredRoutes = routes.filter((route) =>
    route.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-slate-100 px-4">
          <Search className="text-slate-400" size={20} />
          <input
            ref={inputRef}
            className="w-full border-0 bg-transparent py-4 pl-3 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 text-[15px]"
            placeholder="Search for pages, actions... (Cmd+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex gap-1">
             <kbd className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 border border-slate-200">ESC</kbd>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredRoutes.length > 0 ? (
            <div className="space-y-1">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</p>
              {filteredRoutes.map((route, i) => (
                <button
                  key={i}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-[#4f3448]"
                  onClick={() => handleSelect(route.path)}
                >
                  <span className="text-slate-400">{route.icon}</span>
                  {route.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
