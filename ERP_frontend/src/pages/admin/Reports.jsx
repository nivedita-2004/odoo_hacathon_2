import { useMemo, useState } from 'react'
import { Activity, BarChart3, CalendarDays, Download, Filter, PackageCheck, PieChart as PieIcon, Wrench } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const utilizationTrend = [
  { month: 'Jan', utilized: 62, available: 38 }, { month: 'Feb', utilized: 66, available: 34 }, { month: 'Mar', utilized: 71, available: 29 },
  { month: 'Apr', utilized: 69, available: 31 }, { month: 'May', utilized: 75, available: 25 }, { month: 'Jun', utilized: 78, available: 22 }, { month: 'Jul', utilized: 81, available: 19 },
]
const assetUsage = [
  { name: 'Meeting Room B2', uses: 186, type: 'Most Used' }, { name: 'Projector Kit 01', uses: 142, type: 'Most Used' }, { name: 'Dell Latitude', uses: 118, type: 'Most Used' },
  { name: 'Training Room C1', uses: 32, type: 'Idle' }, { name: 'Vehicle 02', uses: 18, type: 'Idle' }, { name: 'Legacy Printer', uses: 7, type: 'Idle' },
]
const maintenanceData = [
  { category: 'Electronics', requests: 46, resolved: 38, avgDays: 3.2 }, { category: 'Vehicles', requests: 18, resolved: 15, avgDays: 4.8 },
  { category: 'Furniture', requests: 9, resolved: 9, avgDays: 1.6 }, { category: 'Office Equip.', requests: 27, resolved: 22, avgDays: 2.9 },
]
const departmentData = [
  { name: 'IT', value: 220 }, { name: 'Operations', value: 280 }, { name: 'Finance', value: 120 }, { name: 'HR', value: 95 }, { name: 'Administration', value: 75 },
]
const watchlist = [
  ['AF-0042', 'Cisco Router 2900', 'Electronics', 'IT', 'Maintenance Due', '18 Jul 2026'], ['AF-0078', 'Toyota Innova', 'Vehicles', 'Operations', 'Maintenance Due', '22 Jul 2026'],
  ['AF-0021', 'HP LaserJet Pro', 'Office Equipment', 'Finance', 'Nearing Retirement', '31 Jul 2026'], ['AF-0009', 'Dell OptiPlex 7040', 'Electronics', 'HR', 'Nearing Retirement', '15 Aug 2026'],
  ['AF-0102', 'Conference Table', 'Furniture', 'Administration', 'Inspection Due', '20 Jul 2026'],
]
const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const heatmap = {
  Monday: [1, 2, 3, 5, 4, 3, 5, 4, 2, 1], Tuesday: [1, 3, 5, 5, 4, 3, 4, 5, 3, 1], Wednesday: [2, 4, 5, 5, 4, 3, 5, 4, 3, 2],
  Thursday: [1, 3, 4, 5, 5, 4, 5, 4, 2, 1], Friday: [2, 4, 5, 4, 3, 2, 3, 4, 2, 1],
}
const colors = ['#4f3448', '#765c70', '#9b8395', '#bdaeb9', '#ddd3da']

const read = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback } }
const downloadCsv = (filename, headers, rows) => {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const content = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' })); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url)
}

export default function Reports() {
  const [department, setDepartment] = useState('All Departments')
  const [period, setPeriod] = useState('Last 6 Months')
  const assets = read('assetflow_assets')
  const maintenance = read('assetflow_maintenance_requests')
  const bookings = read('assetflow_bookings')
  const allocations = read('assetflow_allocations')

  const summary = useMemo(() => ({
    utilization: assets.length ? Math.round((assets.filter((item) => ['Allocated', 'Reserved'].includes(item.status)).length / assets.length) * 100) : 78,
    maintenanceRate: maintenance.length ? Math.round((maintenance.filter((item) => item.status !== 'Resolved').length / maintenance.length) * 100) : 19,
    activeBookings: bookings.filter((item) => item.status !== 'Cancelled').length || 34,
    allocatedAssets: allocations.filter((item) => item.status === 'Active').length || 612,
  }), [assets, maintenance, bookings, allocations])

  const exportReport = (type) => {
    if (type === 'assets') downloadCsv('asset-utilization-report.csv', ['Asset Tag', 'Name', 'Category', 'Department', 'Location', 'Status'], assets.length ? assets.map((item) => [item.tag, item.name, item.category, item.department, item.location, item.status]) : watchlist)
    if (type === 'maintenance') downloadCsv('maintenance-report.csv', ['Category', 'Requests', 'Resolved', 'Average Days'], maintenanceData.map((item) => [item.category, item.requests, item.resolved, item.avgDays]))
    if (type === 'department') downloadCsv('department-allocation-report.csv', ['Department', 'Allocated Assets'], departmentData.map((item) => [item.name, item.value]))
    if (type === 'booking') downloadCsv('resource-booking-report.csv', ['Day', ...hours], days.map((day) => [day, ...heatmap[day]]))
  }

  return <div className="mx-auto max-w-[1600px] space-y-6">
    <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-[#7a6475]">Operational intelligence</p><h1 className="mt-1 text-2xl font-bold text-[#31232e]">Reports & Analytics</h1><p className="mt-2 text-sm text-slate-600">Track utilization, maintenance health, allocation patterns and shared-resource demand.</p></div><div className="flex gap-3"><select className="rounded-lg border border-[#ddd3da] bg-white px-3 py-2.5 text-sm" value={department} onChange={(event) => setDepartment(event.target.value)}><option>All Departments</option><option>Information Technology</option><option>Human Resources</option><option>Finance</option><option>Operations</option><option>Administration</option></select><select className="rounded-lg border border-[#ddd3da] bg-white px-3 py-2.5 text-sm" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Last 30 Days</option><option>Last 3 Months</option><option>Last 6 Months</option><option>This Year</option></select></div></div>
    <div className="flex items-center gap-2 rounded-lg border border-[#e6dee4] bg-white px-4 py-3 text-xs text-slate-500"><Filter size={15} className="text-[#4f3448]" />Showing analytics for <strong className="text-[#31232e]">{department}</strong> · <strong className="text-[#31232e]">{period}</strong></div>
    <section className="grid grid-cols-4 gap-4">{[
      ['Asset Utilization', `${summary.utilization}%`, '3.2% higher than last period', Activity], ['Open Maintenance Rate', `${summary.maintenanceRate}%`, 'Requests currently unresolved', Wrench],
      ['Active Resource Bookings', summary.activeBookings, 'Across shared resources', CalendarDays], ['Active Allocations', summary.allocatedAssets, 'Assets currently assigned', PackageCheck],
    ].map(([label, value, detail, Icon]) => <div key={label} className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-[#31232e]">{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div><div className="h-fit rounded-lg bg-[#f1eaf0] p-2.5 text-[#4f3448]"><Icon size={20} /></div></div></div>)}</section>

    <div className="grid grid-cols-5 gap-6">
      <ChartPanel className="col-span-3" title="Asset Utilization Trend" description="Monthly utilized versus available asset percentage." exportAction={() => exportReport('assets')}><ResponsiveContainer width="100%" height={290}><AreaChart data={utilizationTrend}><defs><linearGradient id="utilized" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f3448" stopOpacity={0.35}/><stop offset="95%" stopColor="#4f3448" stopOpacity={0.03}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#eee8ed"/><XAxis dataKey="month"/><YAxis unit="%"/><Tooltip/><Legend/><Area type="monotone" dataKey="utilized" name="Utilized" stroke="#4f3448" fill="url(#utilized)" strokeWidth={2}/><Area type="monotone" dataKey="available" name="Available" stroke="#a58f9f" fill="#eee8ed"/></AreaChart></ResponsiveContainer></ChartPanel>
      <ChartPanel className="col-span-2" title="Department Allocation" description="Current allocated assets by department." exportAction={() => exportReport('department')}><ResponsiveContainer width="100%" height={290}><PieChart><Pie data={departmentData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={3}>{departmentData.map((item, index) => <Cell key={item.name} fill={colors[index]} />)}</Pie><Tooltip/><Legend verticalAlign="bottom" height={36}/></PieChart></ResponsiveContainer></ChartPanel>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <ChartPanel title="Most-used vs. Idle Assets" description="Usage count highlights high-demand and underused resources." exportAction={() => exportReport('assets')}><ResponsiveContainer width="100%" height={300}><BarChart data={assetUsage} layout="vertical" margin={{ left: 25 }}><CartesianGrid strokeDasharray="3 3" stroke="#eee8ed"/><XAxis type="number"/><YAxis dataKey="name" type="category" width={115} tick={{ fontSize: 11 }}/><Tooltip/><Bar dataKey="uses" radius={[0, 5, 5, 0]}>{assetUsage.map((item) => <Cell key={item.name} fill={item.type === 'Most Used' ? '#4f3448' : '#cdbfc9'} />)}</Bar></BarChart></ResponsiveContainer></ChartPanel>
      <ChartPanel title="Maintenance Frequency" description="Request volume, resolutions and average turnaround by category." exportAction={() => exportReport('maintenance')}><ResponsiveContainer width="100%" height={300}><ComposedChart data={maintenanceData}><CartesianGrid strokeDasharray="3 3" stroke="#eee8ed"/><XAxis dataKey="category" tick={{ fontSize: 11 }}/><YAxis/><Tooltip/><Legend/><Bar dataKey="requests" fill="#4f3448" name="Requests" radius={[4,4,0,0]}/><Bar dataKey="resolved" fill="#a58f9f" name="Resolved" radius={[4,4,0,0]}/><Line type="monotone" dataKey="avgDays" stroke="#dc7a3b" strokeWidth={2} name="Avg. Days"/></ComposedChart></ResponsiveContainer></ChartPanel>
    </div>

    <ChartPanel title="Maintenance & Retirement Watchlist" description="Assets requiring upcoming service, inspection or replacement planning." exportAction={() => downloadCsv('maintenance-retirement-watchlist.csv', ['Asset Tag', 'Asset', 'Category', 'Department', 'Alert', 'Due Date'], watchlist)}><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500">{['Asset Tag', 'Asset', 'Category', 'Department', 'Alert', 'Due Date'].map((item) => <th key={item} className="px-3 py-3">{item}</th>)}</tr></thead><tbody>{watchlist.map((row) => <tr key={row[0]} className="border-b border-slate-100 last:border-0">{row.map((cell, index) => <td key={index} className={`px-3 py-4 ${index === 0 ? 'font-semibold text-[#4f3448]' : 'text-slate-600'}`}>{index === 4 ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cell === 'Nearing Retirement' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{cell}</span> : cell}</td>)}</tr>)}</tbody></table></div></ChartPanel>

    <ChartPanel title="Resource Booking Heatmap" description="Peak usage windows across all shared resources. Darker cells indicate higher demand." exportAction={() => exportReport('booking')}><div className="grid grid-cols-[110px_repeat(10,1fr)] gap-2"><div />{hours.map((hour) => <div key={hour} className="text-center text-xs text-slate-500">{hour}</div>)}{days.map((day) => <HeatmapRow key={day} day={day} values={heatmap[day]} />)}</div><div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500"><span>Low usage</span>{[1,2,3,4,5].map((value) => <span key={value} className="h-4 w-7 rounded" style={{ backgroundColor: `rgba(79,52,72,${0.12 + value * 0.16})` }} />)}<span>Peak usage</span></div></ChartPanel>

    <section className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm"><div className="mb-5"><h2 className="text-lg font-semibold text-[#31232e]">Exportable Reports</h2><p className="mt-1 text-sm text-slate-500">Download operational data for offline analysis and management review.</p></div><div className="grid grid-cols-4 gap-3">{[['Asset Utilization', 'assets', BarChart3], ['Maintenance Analysis', 'maintenance', Wrench], ['Department Allocation', 'department', PieIcon], ['Booking Usage', 'booking', CalendarDays]].map(([label, type, Icon]) => <button key={type} className="group flex items-center justify-between rounded-lg border border-[#e6dee4] p-4 hover:border-[#4f3448] hover:bg-[#faf7f9]" onClick={() => exportReport(type)}><span className="flex items-center gap-3 text-sm font-medium text-slate-700"><Icon className="text-[#4f3448]" size={18}/>{label}</span><Download className="text-slate-400 group-hover:text-[#4f3448]" size={17}/></button>)}</div></section>
  </div>
}

function ChartPanel({ title, description, exportAction, className = '', children }) { return <section className={`rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm ${className}`}><div className="mb-5 flex justify-between"><div><h2 className="text-lg font-semibold text-[#31232e]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{exportAction && <button title="Export CSV" className="h-fit rounded-lg border border-[#e6dee4] p-2 text-[#4f3448] hover:bg-[#f7f3f6]" onClick={exportAction}><Download size={17}/></button>}</div>{children}</section> }
function HeatmapRow({ day, values }) { return <><div className="flex items-center text-sm font-medium text-slate-600">{day}</div>{values.map((value, index) => <div key={`${day}-${index}`} title={`${day}, ${hours[index]}: usage level ${value}/5`} className="grid h-10 place-items-center rounded text-xs font-medium text-white" style={{ backgroundColor: `rgba(79,52,72,${0.12 + value * 0.16})` }}>{value}</div>)}</> }
