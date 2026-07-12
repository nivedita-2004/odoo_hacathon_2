import { useEffect, useState } from 'react'
import { Camera, Clock3, Eye, Plus, Search, Wrench, X } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { API_ENDPOINTS } from '../../config/apis'

export default function Maintenance() {
  const { user } = useAuth(); 
  
  const [allocations, setAllocations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(''); 
  const [form, setForm] = useState(null); 
  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('assetflow_token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [allocRes, reqRes] = await Promise.all([
        fetch(API_ENDPOINTS.ALLOCATIONS.BASE, { headers }),
        fetch(API_ENDPOINTS.MAINTENANCE.REQUESTS, { headers })
      ]);

      const [allocJson, reqJson] = await Promise.all([
        allocRes.json(),
        reqRes.json()
      ]);

      if (allocJson.success) {
        setAllocations(allocJson.data.filter(a => a.employee_id === user.employeeId));
      }
      if (reqJson.success) {
        setRequests(reqJson.data.filter(r => r.raised_by === user.id));
      }
    } catch (err) {
      console.error("Error loading maintenance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const mine = requests.filter((item) => [item.asset_name, item.issue_description, item.status].some((value) => String(value).toLowerCase().includes(search.toLowerCase())));
  
  const raise = async (event) => { 
    event.preventDefault(); 
    
    try {
      const token = localStorage.getItem('assetflow_token');
      const res = await fetch(API_ENDPOINTS.MAINTENANCE.REQUESTS, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: form.assetId,
          issue_description: form.issue,
          priority: form.priority,
          photo_url: form.photo || null
        })
      });
      
      if (!res.ok) throw new Error("Failed to raise request");
      
      setForm(null);
      fetchData(); // Refresh data
    } catch (err) {
      alert(err.message);
    }
  };

  return <div className="mx-auto max-w-[1400px] space-y-6"><div className="flex justify-between"><div><p className="text-sm font-medium text-[#7a6475]">Personal requests</p><h1 className="mt-1 text-2xl font-bold text-[#31232e]">Maintenance Requests</h1><p className="mt-2 text-sm text-slate-600">Raise and track maintenance only for assets currently allocated to you.</p></div><button disabled={!allocations.length} className="inline-flex h-fit items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40" onClick={() => setForm({ assetId: '', issue: '', priority: 'Medium', photo: '' })}><Plus size={18}/>Raise Request</button></div><div className="grid grid-cols-4 gap-4">{[['My Allocated Assets', allocations.length, Wrench], ['Pending', mine.filter((item) => item.status === 'Pending').length, Clock3], ['In Progress', mine.filter((item) => ['Approved', 'Technician Assigned', 'In Progress'].includes(item.status)).length, Wrench], ['Resolved', mine.filter((item) => item.status === 'Resolved').length, Eye]].map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-[#e6dee4] bg-white p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div><Icon className="text-[#4f3448]"/></div></div>)}</div><section className="rounded-xl border border-[#e6dee4] bg-white"><div className="border-b p-5"><div className="relative max-w-lg"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my maintenance requests..."/></div></div><table className="w-full text-left text-sm"><thead><tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">{['Request Date', 'Asset', 'Issue', 'Priority', 'Technician', 'Status'].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{mine.map((item) => <tr key={item.id} className="border-b"><td className="px-4 py-4 font-semibold text-[#4f3448]">{new Date(item.created_at).toLocaleDateString('en-IN')}</td><td className="px-4 py-4">{item.asset_name}<br/><small>{item.asset_tag}</small></td><td className="max-w-72 px-4 py-4">{item.issue_description}</td><td className="px-4 py-4">{item.priority}</td><td className="px-4 py-4">{item.engineer_name || 'Not assigned'}</td><td className="px-4 py-4"><span className="rounded-full bg-[#f1eaf0] px-2.5 py-1 text-xs font-semibold text-[#4f3448]">{item.status}</span></td></tr>)}</tbody></table></section>{form && <RequestModal form={form} setForm={setForm} allocations={allocations} submit={raise}/>}</div>
}

function RequestModal({ form, setForm, allocations, submit }) { 
  const update = (event) => { 
    const { name, value, files } = event.target; 
    setForm({ ...form, [name]: files ? files[0]?.name || '' : value }); 
  }; 
  const input = 'mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5'; 
  return <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6"><form className="w-full max-w-xl rounded-xl bg-white p-6" onSubmit={submit}><div className="flex justify-between"><h2 className="text-xl font-semibold">Raise Maintenance Request</h2><button type="button" onClick={() => setForm(null)}><X size={19}/></button></div><div className="mt-5 space-y-4"><label className="block text-sm font-medium">My Asset<select required className={input} name="assetId" value={form.assetId} onChange={update}><option value="">Select allocated asset</option>{allocations.map((item) => <option key={item.id} value={item.asset_id}>{item.asset_tag} · {item.asset_name}</option>)}</select></label><label className="block text-sm font-medium">Issue Description<textarea required rows="4" className={input} name="issue" value={form.issue} onChange={update}/></label><label className="block text-sm font-medium">Priority<select className={input} name="priority" value={form.priority} onChange={update}>{['Low', 'Medium', 'High', 'Critical'].map((item) => <option key={item}>{item}</option>)}</select></label><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-slate-500"><Camera size={17}/>{form.photo || 'Attach issue photo'}<input hidden name="photo" type="file" accept="image/*" onChange={update}/></label></div><div className="mt-6 flex justify-end gap-3"><button className="rounded-lg border px-4 py-2.5" type="button" onClick={() => setForm(null)}>Cancel</button><button className="rounded-lg bg-[#4f3448] px-4 py-2.5 text-white">Submit Request</button></div></form></div> 
}
