import { Bell, CalendarDays, LogOut, Menu, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { sidebarConfig } from '../../config/sidebarConfig'
import { ROLES } from '../../config/roles'
import useAuth from '../../hooks/useAuth'

const dashboardTitles = {
  [ROLES.ADMIN]: 'Admin Dashboard',
  [ROLES.ASSET_MANAGER]: 'Asset Manager Dashboard',
  [ROLES.DEPARTMENT_HEAD]: 'Department Head Dashboard',
  [ROLES.EMPLOYEE]: 'Employee Dashboard',
}

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const currentItem = (sidebarConfig[user?.role] || []).find((item) => item.path === pathname)
  const isDashboard = pathname.endsWith('/dashboard')
  const pageTitle = isDashboard ? dashboardTitles[user?.role] : currentItem?.label || 'AssetFlow'
  const currentDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())

  return <header className="app-header">
    <div className="flex min-w-0 items-center gap-3"><button aria-label="Open menu" className="header-menu-button rounded-lg border border-[#e4dce2] p-2 text-[#4f3448]" type="button" onClick={onMenuClick}><Menu size={20} /></button><div className="min-w-0"><p className="truncate text-lg font-semibold text-[#31232e]">{pageTitle}</p><p className="text-xs text-slate-500">AssetFlow workspace</p></div></div>
    <div className="flex items-center gap-3"><div className="flex items-center gap-2 rounded-lg bg-[#f7f3f6] px-3 py-2 text-sm text-slate-600"><CalendarDays size={16} />{currentDate}</div><Link aria-label="Notifications" className="relative rounded-lg border border-[#e4dce2] bg-white p-2.5 text-[#4f3448] hover:bg-[#f7f3f6]" to="/notifications"><Bell size={19} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" /></Link><div className="h-8 w-px bg-[#e7e0e5]" /><div className="flex items-center gap-2"><div className="rounded-full bg-[#4f3448] p-2 text-white"><User size={16} /></div><div><p className="max-w-[190px] truncate text-sm font-medium text-[#31232e]">{user?.fullName || user?.email}</p><p className="text-xs text-slate-500">{user?.role?.replaceAll('_', ' ')}</p></div></div><button aria-label="Logout" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" type="button" onClick={logout}><LogOut size={19} /></button></div>
  </header>
}
