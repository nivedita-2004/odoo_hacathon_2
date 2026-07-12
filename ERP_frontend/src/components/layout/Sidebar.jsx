import { ChevronsLeft, ChevronsRight, Layers3 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { sidebarConfig } from '../../config/sidebarConfig'
import useAuth from '../../hooks/useAuth'

export default function Sidebar({ onNavigate, collapsed = false, onToggleCollapse }) {
  const { user } = useAuth()
  const items = sidebarConfig[user?.role] || []
  return <aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
    <div className="sidebar-brand"><div className="brand-mark"><Layers3 size={21} /></div>{!collapsed && <div><strong>AssetFlow</strong><span>Asset Management</span></div>}{onToggleCollapse && <button aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="sidebar-collapse-button" type="button" onClick={onToggleCollapse}>{collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}</button>}</div>
    {!collapsed && <p className="sidebar-section-label">Workspace</p>}
    <nav>{items.map(({ label, path, icon: Icon }) => <NavLink key={path} title={collapsed ? label : undefined} to={path} onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>
    {!collapsed && <div className="sidebar-role"><span>Signed in as</span><strong>{user?.role?.replaceAll('_', ' ')}</strong></div>}
  </aside>
}
