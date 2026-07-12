import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function Panel({ title, description, action, children, className = '' }) {
  return <section className={`rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-[#31232e]">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>
    {children}
  </section>
}

export default function RoleDashboard({ eyebrow, description, primaryAction, metrics, overview, distribution, attention, table, activity, quickActions }) {
  return <div className="mx-auto max-w-[1600px] space-y-6 bg-[#fbfafb]">
    <div className="flex items-center justify-between gap-6">
      <div><p className="mb-1 text-sm font-medium text-[#7a6475]">{eyebrow}</p><p className="text-sm text-slate-600">{description}</p></div>
      <Link className="inline-flex items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3e2939]" to={primaryAction.path}><primaryAction.Icon size={18} />{primaryAction.label}</Link>
    </div>

    <section className="grid grid-cols-4 gap-4">{metrics.map(({ label, value, Icon, detail }) => <div key={label} className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-[#31232e]">{value}</p>{detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}</div><div className="rounded-lg bg-[#f1eaf0] p-2.5 text-[#4f3448]"><Icon size={21} /></div></div></div>)}</section>

    <div className="grid grid-cols-5 gap-6">
      <Panel className="col-span-3" title={overview.title} description={overview.description}><div className="grid grid-cols-3 gap-3">{overview.items.map(({ label, value, Icon }) => <div key={label} className="rounded-lg bg-[#faf8fa] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span><Icon className="text-[#7a6475]" size={17} /></div><p className="text-xl font-semibold text-[#4f3448]">{value}</p></div>)}</div></Panel>
      <Panel className="col-span-2" title={distribution.title} description={distribution.description}><div className="space-y-4">{distribution.items.map(({ label, value, percent }) => <div key={label}><div className="mb-1.5 flex justify-between text-sm"><span className="font-medium text-slate-700">{label}</span><span className="font-semibold text-[#4f3448]">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#6d4a63]" style={{ width: `${percent}%` }} /></div></div>)}</div></Panel>
    </div>

    <Panel title={attention.title} description={attention.description}><div className="grid grid-cols-3 gap-3">{attention.items.map(({ label, value, Icon, path }) => <div key={label} className="flex items-center justify-between rounded-lg border border-[#eadfe7] p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-amber-50 p-2 text-amber-700"><Icon size={18} /></div><div><p className="text-xl font-semibold text-[#31232e]">{value}</p><p className="text-sm text-slate-600">{label}</p></div></div><Link className="inline-flex items-center gap-1 text-sm font-medium text-[#4f3448] hover:underline" to={path}>View <ArrowRight size={15} /></Link></div>)}</div></Panel>

    <Panel title={table.title} description={table.description} action={<Link className="text-sm font-medium text-[#4f3448] hover:underline" to={table.path}>View all</Link>}><div className="overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left text-sm"><thead><tr className="border-b border-[#e6dee4] text-xs uppercase tracking-wide text-slate-500">{table.headers.map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{table.rows.map((row) => <tr key={row[0]} className="border-b border-slate-100 last:border-0">{row.map((cell, index) => <td key={index} className="px-3 py-4 text-slate-600">{index === 0 ? <span className="font-semibold text-[#4f3448]">{cell}</span> : cell}</td>)}<td className="px-3 py-4"><Link className="font-medium text-[#4f3448] hover:underline" to={table.path}>View Details</Link></td></tr>)}</tbody></table></div></Panel>

    <div className="grid grid-cols-5 gap-6">
      <Panel className="col-span-3" title="Recent Activity" description="Latest updates relevant to your workspace."><div className="divide-y divide-slate-100">{activity.map(({ text, time, Icon }) => <div key={text} className="flex items-center justify-between py-4 first:pt-0 last:pb-0"><div className="flex items-center gap-3"><div className="rounded-full bg-[#f1eaf0] p-2 text-[#4f3448]"><Icon size={16} /></div><p className="text-sm font-medium text-slate-700">{text}</p></div><span className="text-xs text-slate-500">{time}</span></div>)}</div></Panel>
      <Panel className="col-span-2" title="Quick Actions" description="Shortcuts for your common tasks."><div className="space-y-3">{quickActions.map(({ label, path, Icon }) => <Link key={label} className="group flex items-center justify-between rounded-lg border border-[#e6dee4] p-4 hover:border-[#4f3448] hover:bg-[#faf7f9]" to={path}><span className="flex items-center gap-3 text-sm font-medium text-slate-700"><Icon className="text-[#4f3448]" size={18} />{label}</span><ArrowRight className="text-slate-400 group-hover:text-[#4f3448]" size={16} /></Link>)}</div></Panel>
    </div>
  </div>
}
