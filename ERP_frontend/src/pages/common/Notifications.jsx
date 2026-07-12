import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRightLeft, Bell, CalendarCheck, Check, CheckCheck, ClipboardCheck, Clock3, PackageCheck, Search, ShieldAlert, UserCog, Wrench, XCircle } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { API_ENDPOINTS } from '../../config/apis'

const iconMap = { asset: PackageCheck, maintenance: Wrench, booking: CalendarCheck, transfer: ArrowRightLeft, overdue: Clock3, audit: ClipboardCheck, user: UserCog, alert: AlertTriangle }
const colorMap = { asset: 'bg-blue-50 text-blue-700', maintenance: 'bg-amber-50 text-amber-700', booking: 'bg-violet-50 text-violet-700', transfer: 'bg-cyan-50 text-cyan-700', overdue: 'bg-red-50 text-red-700', audit: 'bg-orange-50 text-orange-700', user: 'bg-[#f1eaf0] text-[#4f3448]', alert: 'bg-red-50 text-red-700' }

export default function Notifications({ initialTab = 'notifications' }) {
  const { user } = useAuth()
  const [feed, setFeed] = useState({ notifications: [], logs: [] })
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('assetflow_token')
    const loadFeed = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.DASHBOARD.NOTIFICATIONS, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await response.json()
        if (json.success) {
          setFeed({ notifications: json.data.notifications || [], logs: json.data.logs || [] })
          setReadIds(json.data.readIds || [])
        } else {
          setFetchError(json.error || 'Unable to load notifications')
        }
      } catch (error) {
        setFetchError(error.message || 'Unable to load notifications')
      } finally {
        setLoading(false)
      }
    }

    loadFeed()
  }, [])

  const departmentScoped = user?.role === 'DEPARTMENT_HEAD'
  const employeeScoped = user?.role === 'EMPLOYEE'
  const identities = [user?.fullName, user?.email, user?.employeeId].filter(Boolean).map((item) => item.toLowerCase())
  const belongsToEmployee = (item) => identities.some((identity) => item.recipient?.toLowerCase() === identity || item.actor?.toLowerCase() === identity || item.message?.toLowerCase().includes(identity) || item.action?.toLowerCase().includes(identity))
  const notifications = departmentScoped ? feed.notifications.filter((item) => item.department === user.department) : employeeScoped ? feed.notifications.filter(belongsToEmployee) : feed.notifications
  const logs = departmentScoped ? feed.logs.filter((item) => item.department === user.department) : employeeScoped ? feed.logs.filter(belongsToEmployee) : feed.logs
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All')
  const [showUnread, setShowUnread] = useState(false)
  const [readIds, setReadIds] = useState([])
  const [selected, setSelected] = useState(null)
  
  const saveRead = async (ids, idToMark = null, all = false) => { 
    setReadIds(ids); 
    const token = localStorage.getItem('assetflow_token');
    
    try {
      if (all) {
        await fetch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ notificationIds: ids })
        });
      } else if (idToMark) {
        await fetch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(idToMark), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Failed to save read state', err);
    }
  }
  
  const markRead = (id) => saveRead(readIds.includes(id) ? readIds : [...readIds, id], id)
  const markAll = () => saveRead(notifications.map((item) => item.id), null, true)
  const unread = notifications.filter((item) => !readIds.includes(item.id)).length
  const filteredNotifications = notifications.filter((item) => (!showUnread || !readIds.includes(item.id)) && (type === 'All' || item.type === type) && [item.title, item.message, item.module, item.actor].some((value) => value.toLowerCase().includes(search.toLowerCase())))
  const filteredLogs = logs.filter((item) => (type === 'All' || item.type === type) && [item.action, item.actor, item.module, item.detail].some((value) => String(value).toLowerCase().includes(search.toLowerCase())))

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-slate-500">Loading notifications...</div>
  if (fetchError) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-red-500">Error: {fetchError}</div>

  return <div className="mx-auto max-w-[1500px] space-y-6">
    <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-[#7a6475]">Updates & traceability</p><h1 className="mt-1 text-2xl font-bold text-[#31232e]">Activity Logs & Notifications</h1><p className="mt-2 text-sm text-slate-600">Stay informed about workflow updates and review who performed every recorded action.</p></div><div className="rounded-lg bg-[#f7f3f6] px-4 py-3 text-right"><p className="text-xs text-slate-500">Viewing as</p><p className="text-sm font-semibold text-[#4f3448]">{user?.role?.replaceAll('_', ' ')}</p></div></div>
    <div className="grid grid-cols-4 gap-4">{[['Unread', unread, Bell], ['Critical Alerts', notifications.filter((item) => item.priority === 'critical').length, ShieldAlert], ['Workflow Updates', notifications.filter((item) => item.actor !== 'System').length, CheckCheck], ['Logged Actions', logs.length, ClipboardCheck]].map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-[#31232e]">{value}</p></div><div className="h-fit rounded-lg bg-[#f1eaf0] p-2.5 text-[#4f3448]"><Icon size={20}/></div></div></div>)}</div>
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#e6dee4] bg-white p-2"><button className={`rounded-lg px-4 py-3 text-sm font-semibold ${tab === 'notifications' ? 'bg-[#4f3448] text-white' : 'text-slate-600'}`} onClick={() => setTab('notifications')}>Notifications {unread > 0 && <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unread}</span>}</button><button className={`rounded-lg px-4 py-3 text-sm font-semibold ${tab === 'activity' ? 'bg-[#4f3448] text-white' : 'text-slate-600'}`} onClick={() => setTab('activity')}>Full Activity Log</button></div>
    <section className="rounded-xl border border-[#e6dee4] bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-[#e6dee4] p-5"><div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3 outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${tab === 'notifications' ? 'notifications' : 'activity logs'}...`}/></div><select className="rounded-lg border border-[#ddd3da] px-3 py-2.5 text-sm" value={type} onChange={(event) => setType(event.target.value)}><option>All</option><option value="asset">Assets</option><option value="maintenance">Maintenance</option><option value="booking">Bookings</option><option value="transfer">Transfers</option><option value="overdue">Overdue</option><option value="audit">Audits</option><option value="user">Users</option></select>{tab === 'notifications' && <><button className={`rounded-lg border px-3 py-2.5 text-sm ${showUnread ? 'border-[#4f3448] bg-[#f1eaf0] text-[#4f3448]' : 'border-[#ddd3da] text-slate-600'}`} onClick={() => setShowUnread(!showUnread)}>Unread only</button><button className="inline-flex items-center gap-2 rounded-lg bg-[#4f3448] px-3 py-2.5 text-sm font-medium text-white" onClick={markAll}><CheckCheck size={16}/>Mark all read</button></>}</div>
      {tab === 'notifications' ? <div className="divide-y divide-slate-100">{filteredNotifications.map((item) => { const Icon = iconMap[item.type] || Bell; const isRead = readIds.includes(item.id); return <button key={item.id} className={`flex w-full items-start gap-4 p-5 text-left hover:bg-[#fcfafb] ${isRead ? 'opacity-65' : ''}`} onClick={() => { markRead(item.id); setSelected(item) }}><div className={`rounded-lg p-2.5 ${colorMap[item.type]}`}><Icon size={19}/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-semibold text-[#31232e]">{item.title}</p>{!isRead && <span className="h-2 w-2 rounded-full bg-[#4f3448]"/>}{item.priority === 'critical' && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">Critical</span>}</div><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{item.module} · {item.actor}</p></div><span className="whitespace-nowrap text-xs text-slate-500">{item.time}</span></button>})}</div> : <ActivityTable rows={filteredLogs}/>} 
    </section>
    {selected && <div className="fixed inset-0 z-20 grid place-items-center bg-black/30 p-6"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex justify-between"><div><p className="text-xs font-semibold uppercase text-[#7a6475]">{selected.module}</p><h2 className="mt-1 text-xl font-semibold text-[#31232e]">{selected.title}</h2></div><button onClick={() => setSelected(null)}><XCircle size={19}/></button></div><p className="mt-4 text-sm leading-6 text-slate-600">{selected.message}</p><div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-[#f8f5f7] p-4 text-sm"><div><p className="text-xs text-slate-500">Triggered by</p><p className="font-medium">{selected.actor}</p></div><div><p className="text-xs text-slate-500">Time</p><p className="font-medium">{selected.time}</p></div></div></div></div>}
  </div>
}

function ActivityTable({ rows }) { return <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead><tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">{['Action', 'User / Actor', 'Time', 'Module', 'Details'].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{rows.map((item) => { const Icon = iconMap[item.type] || Check; return <tr key={item.id} className="border-b border-slate-100"><td className="px-4 py-4"><span className="flex items-center gap-2 font-medium text-[#31232e]"><Icon className="text-[#4f3448]" size={16}/>{item.action}</span></td><td className="px-4 py-4 text-slate-600">{item.actor}</td><td className="px-4 py-4 text-slate-600">{item.time}</td><td className="px-4 py-4"><span className="rounded-full bg-[#f1eaf0] px-2.5 py-1 text-xs font-semibold text-[#4f3448]">{item.module}</span></td><td className="max-w-80 px-4 py-4 text-slate-500">{item.detail}</td></tr>})}</tbody></table></div> }
