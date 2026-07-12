import { useEffect, useState } from 'react'
import { ArrowRightLeft, Clock3, Plus, RotateCcw, Search, X } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { API_ENDPOINTS } from '../../config/apis'

export default function ReturnRequests() {
  const { user } = useAuth(); 
  const identity = user?.fullName || user?.email;
  
  const [allocations, setAllocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('return'); 
  const [search, setSearch] = useState(''); 
  const [form, setForm] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('assetflow_token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [allocRes, deptRes, returnRes, transferRes] = await Promise.all([
        fetch(API_ENDPOINTS.ALLOCATIONS.BASE, { headers }),
        fetch(API_ENDPOINTS.ORGANIZATION.DEPARTMENTS, { headers }),
        fetch(API_ENDPOINTS.ALLOCATIONS.RETURNS_HISTORY, { headers }),
        fetch(API_ENDPOINTS.ALLOCATIONS.TRANSFERS, { headers })
      ]);

      const [allocJson, deptJson, returnJson, transferJson] = await Promise.all([
        allocRes.json(), deptRes.json(), returnRes.json(), transferRes.json()
      ]);

      if (allocJson.success) {
        setAllocations(allocJson.data.filter(a => a.employee_id === user.employeeId));
      }
      if (deptJson.success) {
        setDepartments(deptJson.data);
      }
      if (returnJson.success) {
        setReturns(returnJson.data.filter(r => r.returned_by === user.id));
      }
      if (transferJson.success) {
        setTransfers(transferJson.data.filter(t => t.from_department === user.department));
      }
    } catch (err) {
      console.error("Error loading return requests data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const myReturns = returns.filter((item) => [item.asset_name, item.notes, item.status].some((value) => String(value).toLowerCase().includes(search.toLowerCase())));
  const myTransfers = transfers.filter((item) => [item.asset_name, item.to_department, item.status].some((value) => String(value).toLowerCase().includes(search.toLowerCase())));

  const submit = async (event) => { 
    event.preventDefault(); 
    const allocation = allocations.find((item) => item.id === form.allocationId); 
    
    try {
      const token = localStorage.getItem('assetflow_token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      if (tab === 'return') {
        const res = await fetch(API_ENDPOINTS.ALLOCATIONS.RETURN, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            allocation_id: allocation.id,
            notes: form.reason,
            condition: 'Good'
          })
        });
        if (!res.ok) throw new Error("Failed to return asset");
      } else {
        const res = await fetch(API_ENDPOINTS.ALLOCATIONS.REQUEST_TRANSFER, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            asset_id: allocation.asset_id,
            destination_department_id: form.to,
            reason: form.reason
          })
        });
        if (!res.ok) throw new Error("Failed to request transfer");
      }
      
      setForm(null);
      fetchData(); // refresh data

    } catch (err) {
      alert(err.message);
    }
  };

  const open = () => setForm(tab === 'return' ? { allocationId: '', reason: '', preferredDate: '' } : { allocationId: '', to: '', reason: '' });

  return <div className="mx-auto max-w-[1400px] space-y-6"><div className="flex justify-between"><div><p className="text-sm font-medium text-[#7a6475]">Personal requests</p><h1 className="mt-1 text-2xl font-bold text-[#31232e]">Return & Transfer Requests</h1><p className="mt-2 text-sm text-slate-600">Initiate and track requests only for assets currently allocated to you.</p></div><button disabled={!allocations.length} className="inline-flex h-fit items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40" onClick={open}><Plus size={18}/>New {tab === 'return' ? 'Return' : 'Transfer'} Request</button></div><div className="grid grid-cols-4 gap-4">{[['My Assets', allocations.length, Clock3], ['Pending Returns', 0, RotateCcw], ['Pending Transfers', myTransfers.filter((item) => item.status === 'PENDING').length, ArrowRightLeft], ['Completed Requests', [...myReturns, ...myTransfers].filter((item) => ['APPROVED', 'Returned', 'REJECTED'].includes(item.status)).length, Clock3]].map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-[#e6dee4] bg-white p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div><Icon className="text-[#4f3448]"/></div></div>)}</div><div className="grid grid-cols-2 gap-2 rounded-xl border border-[#e6dee4] bg-white p-2"><button className={`rounded-lg p-3 text-sm font-semibold ${tab === 'return' ? 'bg-[#4f3448] text-white' : 'text-slate-600'}`} onClick={() => setTab('return')}>Returns History</button><button className={`rounded-lg p-3 text-sm font-semibold ${tab === 'transfer' ? 'bg-[#4f3448] text-white' : 'text-slate-600'}`} onClick={() => setTab('transfer')}>Transfer Requests</button></div><section className="rounded-xl border border-[#e6dee4] bg-white"><div className="border-b p-5"><div className="relative max-w-lg"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my requests..."/></div></div><RequestTable rows={tab === 'return' ? myReturns : myTransfers} type={tab}/></section>{form && <RequestModal type={tab} form={form} setForm={setForm} allocations={allocations} departments={departments} submit={submit}/>}</div>
}

function RequestTable({ rows, type }) { 
  return <table className="w-full text-left text-sm"><thead><tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">{(type === 'return' ? ['Asset', 'Notes', 'Returned On', 'Status'] : ['Asset', 'Transfer To', 'Reason', 'Requested On', 'Status']).map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{rows.map((item, index) => <tr key={index} className="border-b"><td className="px-4 py-4">{item.asset_name}</td>{type === 'transfer' && <td className="px-4 py-4">{item.to_department}</td>}<td className="px-4 py-4">{item.notes || item.reason}</td><td className="px-4 py-4">{new Date(item.created_at || item.actual_return_date).toLocaleDateString('en-IN')}</td><td className="px-4 py-4"><span className="rounded-full bg-[#f1eaf0] px-2.5 py-1 text-xs font-semibold text-[#4f3448]">{item.status || 'Returned'}</span></td></tr>)}</tbody></table> 
}

function RequestModal({ type, form, setForm, allocations, departments, submit }) { 
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value }); 
  const input = 'mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5'; 
  return <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6"><form className="w-full max-w-xl rounded-xl bg-white p-6" onSubmit={submit}><div className="flex justify-between"><h2 className="text-xl font-semibold">New {type === 'return' ? 'Return' : 'Transfer'} Request</h2><button type="button" onClick={() => setForm(null)}><X size={19}/></button></div><div className="mt-5 space-y-4"><label className="block text-sm font-medium">My Allocated Asset<select required className={input} name="allocationId" value={form.allocationId} onChange={update}><option value="">Select asset</option>{allocations.map((item) => <option key={item.id} value={item.id}>{item.asset_tag} · {item.asset_name}</option>)}</select></label>{type === 'transfer' && <label className="block text-sm font-medium">Transfer To<select required className={input} name="to" value={form.to} onChange={update}><option value="">Select destination department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}{type === 'return' && <label className="block text-sm font-medium">Condition<select required className={input} name="reason" value={form.reason} onChange={update}><option value="">Select condition upon return</option><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Damaged">Damaged</option></select></label>}{type === 'transfer' && <label className="block text-sm font-medium">Reason<textarea required rows="4" className={input} name="reason" value={form.reason} onChange={update}/></label>}</div><div className="mt-6 flex justify-end gap-3"><button className="rounded-lg border px-4 py-2.5" type="button" onClick={() => setForm(null)}>Cancel</button><button className="rounded-lg bg-[#4f3448] px-4 py-2.5 text-white">Submit Request</button></div></form></div> 
}
