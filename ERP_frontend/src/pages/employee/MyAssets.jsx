import { useEffect, useState } from 'react'
import { Boxes, Clock3, Eye, Search, Wrench, X, MapPin } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { API_ENDPOINTS } from '../../config/apis'

export default function MyAssets() {
  const { user } = useAuth(); 
  const [search, setSearch] = useState(''); 
  const [selected, setSelected] = useState(null);
  
  const [allocations, setAllocations] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('assetflow_token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [allocRes, assetRes, maintRes] = await Promise.all([
          fetch(API_ENDPOINTS.ALLOCATIONS.BASE, { headers }),
          fetch(API_ENDPOINTS.ASSETS.GET_ALL, { headers }),
          // Just an empty array fallback for maintenance until we wire it up fully
          Promise.resolve({ json: () => ({ success: true, data: [] }) }) 
        ]);

        const [allocJson, assetJson, maintJson] = await Promise.all([
          allocRes.json(),
          assetRes.json(),
          maintRes.json()
        ]);

        if (allocJson.success) {
          // Filter only allocations for this specific employee
          const myAllocations = allocJson.data.filter(a => a.employee_id === user.employeeId);
          setAllocations(myAllocations);
        }
        
        if (assetJson.success) {
          setAllAssets(assetJson.data);
        }

        if (maintJson.success) {
          setMaintenance(maintJson.data);
        }

      } catch (err) {
        console.error("Failed to load employee assets", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      fetchData();
    }
  }, [user]);

  const assets = allocations.map((allocation) => {
    const asset = allAssets.find((item) => item.asset_tag === allocation.asset_tag);
    return {
      ...asset,
      allocation: {
        allocatedOn: allocation.allocated_date ? new Date(allocation.allocated_date).toLocaleDateString('en-IN') : '',
        expectedReturn: allocation.expected_return_date ? new Date(allocation.expected_return_date).toLocaleDateString('en-IN') : ''
      }
    };
  }).filter((item) => item.asset_tag).filter((item) => [item.asset_tag, item.name, item.category_name, item.location].some((value) => String(value).toLowerCase().includes(search.toLowerCase())));

  return <div className="mx-auto max-w-[1400px] space-y-6"><div><p className="text-sm font-medium text-[#7a6475]">Personal custody</p><h1 className="mt-1 text-2xl font-bold text-[#31232e]">My Allocated Assets</h1><p className="mt-2 text-sm text-slate-600">Only assets currently allocated to your employee account are shown here.</p></div><div className="grid grid-cols-4 gap-4">{[['My Assets', assets.length, Boxes], ['Good Condition', assets.filter((item) => ['Excellent', 'Good'].includes(item.condition)).length, Eye], ['Return Due Soon', allocations.filter((item) => item.expected_return_date).length, Clock3], ['Open Maintenance', maintenance.filter((item) => !['Resolved', 'Rejected'].includes(item.status)).length, Wrench]].map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-[#e6dee4] bg-white p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div><Icon className="text-[#4f3448]"/></div></div>)}</div><section className="rounded-xl border border-[#e6dee4] bg-white"><div className="border-b p-5"><div className="relative max-w-lg"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my assets..."/></div></div><div className="grid grid-cols-3 gap-4 p-5">{assets.map((item) => <button key={item.asset_tag} className="rounded-xl border border-[#e6dee4] p-5 text-left hover:border-[#4f3448]" onClick={() => setSelected(item)}><div className="flex justify-between"><span className="font-semibold text-[#4f3448]">{item.asset_tag}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{item.status}</span></div><h3 className="mt-4 font-semibold text-[#31232e]">{item.name}</h3><p className="mt-1 text-sm text-slate-500">{item.category_name}</p><p className="mt-4 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13}/>{item.department_name}</p><div className="mt-4 border-t pt-3 text-xs text-slate-500"><p>Allocated: {item.allocation.allocatedOn}</p><p className="mt-1">Expected return: {item.allocation.expectedReturn || 'Open allocation'}</p></div></button>)}{!assets.length && <p className="col-span-3 py-12 text-center text-sm text-slate-500">{loading ? 'Loading...' : 'No assets are currently allocated to your account.'}</p>}</div></section>{selected && <div className="fixed inset-0 z-20 flex justify-end bg-black/25"><div className="h-full w-[500px] overflow-y-auto bg-white p-6"><div className="flex justify-between"><div><p className="font-semibold text-[#4f3448]">{selected.asset_tag}</p><h2 className="text-xl font-semibold">{selected.name}</h2></div><button onClick={() => setSelected(null)}><X size={19}/></button></div><div className="mt-6 grid grid-cols-2 gap-3 rounded-lg bg-[#f8f5f7] p-4">{[['Category', selected.category_name], ['Condition', selected.condition], ['Location', selected.department_name], ['Serial', selected.serial_number]].map(([label, value]) => <div key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium">{value || 'Not set'}</p></div>)}</div><h3 className="mt-6 font-semibold">My Asset History</h3><div className="mt-3 space-y-3">{[...(selected.allocationHistory || []), ...(selected.maintenanceHistory || [])].map((item, index) => <div key={index} className="border-l-2 border-[#d9ccd5] pl-4"><p className="text-sm font-medium">{item.event}</p><p className="text-xs text-slate-500">{item.date} · {item.detail}</p></div>)}</div></div></div>}</div>
}
