import { useEffect, useState } from 'react'
import { Activity, BarChart3, CalendarDays, Download, Filter, PackageCheck, PieChart as PieIcon, Wrench } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { API_ENDPOINTS } from '../../config/apis'

const colors = ['#4f3448', '#765c70', '#9b8395', '#bdaeb9', '#ddd3da']
const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const downloadCsv = (filename, headers, rows) => {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const content = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('assetflow_token')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const res = await fetch(API_ENDPOINTS.REPORTS.BASE, { headers })
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading || !data) {
    return <div className="p-10 text-center text-slate-500">Loading reports...</div>
  }

  const { summary, departmentAllocation, maintenanceByPriority, assetUsage, heatmap, utilizationTrend, watchlist, allAssets } = data

  const exportReport = (type) => {
    if (type === 'assets')
      downloadCsv('asset-utilization-report.csv', ['Asset Tag', 'Name', 'Status', 'Department'], allAssets.map((item) => [item.asset_tag, item.name, item.status, item.department || '-']))
    if (type === 'maintenance')
      downloadCsv('maintenance-report.csv', ['Priority', 'Requests', 'Resolved'], maintenanceByPriority.map((item) => [item.category, item.requests, item.resolved]))
    if (type === 'department')
      downloadCsv('department-allocation-report.csv', ['Department', 'Allocated Assets'], departmentAllocation.map((item) => [item.name, item.value]))
    if (type === 'booking')
      downloadCsv('resource-booking-report.csv', ['Day', ...hours], days.map((day) => [day, ...(heatmap[day] || Array(10).fill(0))]))
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#7a6475]">Operational intelligence</p>
          <h1 className="mt-1 text-2xl font-bold text-[#31232e]">Reports & Analytics</h1>
          <p className="mt-2 text-sm text-slate-600">
            Track utilization, maintenance health, allocation patterns and shared-resource demand.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[#e6dee4] bg-white px-4 py-3 text-xs text-slate-500">
        <Filter size={15} className="text-[#4f3448]" />
        Showing analytics for <strong className="text-[#31232e]">All Departments</strong> · <strong className="text-[#31232e]">{summary.totalAssets} total assets</strong>
      </div>

      <section className="grid grid-cols-4 gap-4">
        {[
          ['Asset Utilization', `${summary.utilization}%`, `${summary.totalAssets} total assets tracked`, Activity],
          ['Open Maintenance Rate', `${summary.maintenanceRate}%`, 'Requests currently unresolved', Wrench],
          ['Active Resource Bookings', summary.activeBookings, 'Across shared resources', CalendarDays],
          ['Active Allocations', summary.activeAllocations, 'Assets currently assigned', PackageCheck],
        ].map(([label, value, detail, Icon]) => (
          <div key={label} className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[#31232e]">{value}</p>
                <p className="mt-2 text-xs text-slate-500">{detail}</p>
              </div>
              <div className="h-fit rounded-lg bg-[#f1eaf0] p-2.5 text-[#4f3448]">
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-5 gap-6">
        <ChartPanel
          className="col-span-3"
          title="Asset Utilization Trend"
          description="Monthly utilized versus available asset percentage."
          exportAction={() => exportReport('assets')}
        >
          {utilizationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={utilizationTrend}>
                <defs>
                  <linearGradient id="utilized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f3448" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f3448" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee8ed" />
                <XAxis dataKey="month" />
                <YAxis unit="%" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="utilized" name="Utilized" stroke="#4f3448" fill="url(#utilized)" strokeWidth={2} />
                <Area type="monotone" dataKey="available" name="Available" stroke="#a58f9f" fill="#eee8ed" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-slate-400">No allocation data yet. Allocate assets to see trends.</p>
          )}
        </ChartPanel>

        <ChartPanel
          className="col-span-2"
          title="Department Allocation"
          description="Current allocated assets by department."
          exportAction={() => exportReport('department')}
        >
          {departmentAllocation.length > 0 ? (
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie data={departmentAllocation} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={3}>
                  {departmentAllocation.map((item, index) => (
                    <Cell key={item.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-slate-400">No department assignments yet.</p>
          )}
        </ChartPanel>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ChartPanel
          title="Most-used vs. Idle Assets"
          description="Usage count highlights high-demand and underused resources."
          exportAction={() => exportReport('assets')}
        >
          {assetUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assetUsage} layout="vertical" margin={{ left: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee8ed" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={115} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="uses" radius={[0, 5, 5, 0]}>
                  {assetUsage.map((item) => (
                    <Cell key={item.name} fill={item.type === 'Most Used' ? '#4f3448' : '#cdbfc9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-slate-400">No booking data yet. Book resources to see usage stats.</p>
          )}
        </ChartPanel>

        <ChartPanel
          title="Maintenance by Priority"
          description="Request volume and resolutions grouped by priority level."
          exportAction={() => exportReport('maintenance')}
        >
          {maintenanceByPriority.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={maintenanceByPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee8ed" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#4f3448" name="Requests" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#a58f9f" name="Resolved" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-slate-400">No maintenance data yet.</p>
          )}
        </ChartPanel>
      </div>

      <ChartPanel
        title="Asset Watchlist"
        description="Assets currently under maintenance, disposed, or lost that need attention."
        exportAction={() =>
          downloadCsv(
            'asset-watchlist.csv',
            ['Asset Tag', 'Name', 'Status', 'Department'],
            watchlist.map((item) => [item.asset_tag, item.name, item.status, item.department || '-']),
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-slate-500">
                {['Asset Tag', 'Asset', 'Status', 'Department'].map((item) => (
                  <th key={item} className="px-3 py-3">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {watchlist.map((row) => (
                <tr key={row.asset_tag} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-4 font-semibold text-[#4f3448]">{row.asset_tag}</td>
                  <td className="px-3 py-4 text-slate-600">{row.name}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.status === 'Lost'
                          ? 'bg-red-50 text-red-700'
                          : row.status === 'Disposed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-slate-600">{row.department || '-'}</td>
                </tr>
              ))}
              {watchlist.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-400">
                    No assets currently need attention. Everything looks good!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartPanel>

      <ChartPanel
        title="Resource Booking Heatmap"
        description="Peak usage windows across all shared resources. Darker cells indicate higher demand."
        exportAction={() => exportReport('booking')}
      >
        <div className="grid grid-cols-[110px_repeat(10,1fr)] gap-2">
          <div />
          {hours.map((hour) => (
            <div key={hour} className="text-center text-xs text-slate-500">
              {hour}
            </div>
          ))}
          {days.map((day) => (
            <HeatmapRow key={day} day={day} values={heatmap[day] || Array(10).fill(0)} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>Low usage</span>
          {[1, 2, 3, 4, 5].map((value) => (
            <span key={value} className="h-4 w-7 rounded" style={{ backgroundColor: `rgba(79,52,72,${0.12 + value * 0.16})` }} />
          ))}
          <span>Peak usage</span>
        </div>
      </ChartPanel>

      <section className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#31232e]">Exportable Reports</h2>
          <p className="mt-1 text-sm text-slate-500">Download operational data for offline analysis and management review.</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            ['Asset Utilization', 'assets', BarChart3],
            ['Maintenance Analysis', 'maintenance', Wrench],
            ['Department Allocation', 'department', PieIcon],
            ['Booking Usage', 'booking', CalendarDays],
          ].map(([label, type, Icon]) => (
            <button
              key={type}
              className="group flex items-center justify-between rounded-lg border border-[#e6dee4] p-4 hover:border-[#4f3448] hover:bg-[#faf7f9]"
              onClick={() => exportReport(type)}
            >
              <span className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <Icon className="text-[#4f3448]" size={18} />
                {label}
              </span>
              <Download className="text-slate-400 group-hover:text-[#4f3448]" size={17} />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function ChartPanel({ title, description, exportAction, className = '', children }) {
  return (
    <section className={`rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-5 flex justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#31232e]">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {exportAction && (
          <button title="Export CSV" className="h-fit rounded-lg border border-[#e6dee4] p-2 text-[#4f3448] hover:bg-[#f7f3f6]" onClick={exportAction}>
            <Download size={17} />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function HeatmapRow({ day, values }) {
  return (
    <>
      <div className="flex items-center text-sm font-medium text-slate-600">{day}</div>
      {values.map((value, index) => (
        <div
          key={`${day}-${index}`}
          title={`${day}, ${hours[index]}: usage level ${value}/5`}
          className="grid h-10 place-items-center rounded text-xs font-medium text-white"
          style={{ backgroundColor: `rgba(79,52,72,${0.12 + value * 0.16})` }}
        >
          {value}
        </div>
      ))}
    </>
  )
}
