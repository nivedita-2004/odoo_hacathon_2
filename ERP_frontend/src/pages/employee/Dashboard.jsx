import { ArrowRightLeft, Boxes, CalendarCheck, CheckCircle2, Clock3, History, RotateCcw, Wrench } from 'lucide-react'
import RoleDashboard from '../../components/dashboard/RoleDashboard'
import useAuth from '../../hooks/useAuth'

const read = (key) => { try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] } }
const matches = (value, user) => [user?.fullName, user?.email, user?.employeeId].filter(Boolean).some((item) => value?.toLowerCase() === item.toLowerCase())

export default function Dashboard() {
  const { user } = useAuth(); const identity = user?.fullName || user?.email
  const allocations = read('assetflow_allocations').filter((item) => matches(item.holder, user))
  const active = allocations.filter((item) => item.status === 'Active'); const allAssets = read('assetflow_assets'); const assets = active.map((item) => ({ ...allAssets.find((asset) => asset.tag === item.assetTag), allocation: item })).filter((item) => item.tag)
  const bookings = read('assetflow_bookings').filter((item) => matches(item.bookedBy, user))
  const maintenance = read('assetflow_maintenance_requests').filter((item) => matches(item.raisedBy, user))
  const returns = read('assetflow_return_requests').filter((item) => matches(item.requestedBy, user))
  const transfers = read('assetflow_transfers').filter((item) => matches(item.from, user))
  const pending = [...maintenance, ...returns, ...transfers].filter((item) => ['Pending', 'Requested', 'Approved', 'Technician Assigned', 'In Progress'].includes(item.status))
  return <RoleDashboard eyebrow={`Welcome, ${identity}`} description="Track only your allocated assets, bookings, maintenance, return and transfer requests." primaryAction={{ label: 'View My Assets', path: '/employee/my-assets', Icon: Boxes }}
    metrics={[
      { label: 'My Assets', value: assets.length, Icon: Boxes, detail: 'Currently allocated to you' }, { label: 'Active Bookings', value: bookings.filter((item) => !['Cancelled', 'Completed'].includes(item.status)).length, Icon: CalendarCheck, detail: 'Your shared resources' },
      { label: 'Pending Requests', value: pending.length, Icon: Clock3, detail: 'Across personal workflows' }, { label: 'Resolved Maintenance', value: maintenance.filter((item) => item.status === 'Resolved').length, Icon: CheckCircle2, detail: 'Completed requests' },
      { label: 'Maintenance Open', value: maintenance.filter((item) => !['Resolved', 'Rejected'].includes(item.status)).length, Icon: Wrench, detail: 'Raised by you' }, { label: 'Return Requests', value: returns.filter((item) => item.status === 'Requested').length, Icon: RotateCcw, detail: 'Awaiting processing' },
      { label: 'Transfer Requests', value: transfers.filter((item) => item.status === 'Requested').length, Icon: ArrowRightLeft, detail: 'Awaiting approval' }, { label: 'Due Soon', value: active.filter((item) => item.expectedReturn).length, Icon: Clock3, detail: 'Assets with return dates' },
    ]}
    overview={{ title: 'My Activity Overview', description: 'Live personal workflow totals.', items: [
      { label: 'Assets Assigned', value: assets.length, Icon: Boxes }, { label: 'Bookings Created', value: bookings.length, Icon: CalendarCheck }, { label: 'Requests Completed', value: [...maintenance, ...returns, ...transfers].filter((item) => ['Resolved', 'Approved', 'Completed'].includes(item.status)).length, Icon: CheckCircle2 },
      { label: 'Assets Returned', value: allocations.filter((item) => item.status === 'Returned').length, Icon: RotateCcw }, { label: 'Issues Reported', value: maintenance.length, Icon: Wrench }, { label: 'Request History', value: maintenance.length + returns.length + transfers.length, Icon: History },
    ] }}
    distribution={{ title: 'My Asset Condition', description: 'Condition of assets currently assigned to you.', items: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'].map((label) => { const value = assets.filter((item) => item.condition === label).length; return { label, value: `${value} asset${value === 1 ? '' : 's'}`, percent: Math.max(value ? 8 : 0, assets.length ? Math.round((value / assets.length) * 100) : 0) } }) }}
    attention={{ title: 'My Pending Items', description: 'Only your own bookings and requests.', items: [
      { label: 'Upcoming Bookings', value: bookings.filter((item) => item.status !== 'Cancelled').length, Icon: CalendarCheck, path: '/employee/bookings' }, { label: 'Maintenance Pending', value: maintenance.filter((item) => item.status === 'Pending').length, Icon: Wrench, path: '/employee/maintenance' },
      { label: 'Maintenance In Progress', value: maintenance.filter((item) => ['Approved', 'Technician Assigned', 'In Progress'].includes(item.status)).length, Icon: Wrench, path: '/employee/maintenance' }, { label: 'Return Requests', value: returns.filter((item) => item.status === 'Requested').length, Icon: RotateCcw, path: '/employee/return-transfer-requests' },
      { label: 'Transfer Requests', value: transfers.filter((item) => item.status === 'Requested').length, Icon: ArrowRightLeft, path: '/employee/return-transfer-requests' }, { label: 'Allocated Assets', value: assets.length, Icon: Boxes, path: '/employee/my-assets' },
    ] }}
    table={{ title: 'My Assigned Assets', description: 'Only assets issued to your employee account.', path: '/employee/my-assets', headers: ['Asset Tag', 'Asset Name', 'Category', 'Assigned On', 'Expected Return', 'Condition', 'Action'], rows: assets.map((item) => [item.tag, item.name, item.category || 'Uncategorized', item.allocation.allocatedOn, item.allocation.expectedReturn || 'Open allocation', item.condition || 'Not set']) }}
    activity={[
      ...maintenance.slice(-1).map((item) => ({ text: `${item.id} is ${item.status}`, time: item.raisedOn, Icon: Wrench })), ...returns.slice(-1).map((item) => ({ text: `${item.id} is ${item.status}`, time: item.requestedOn, Icon: RotateCcw })),
      ...transfers.slice(-1).map((item) => ({ text: `${item.id} is ${item.status}`, time: item.requestedOn, Icon: ArrowRightLeft })), ...bookings.slice(-1).map((item) => ({ text: `${item.resource} booking ${item.status || 'confirmed'}`, time: item.date, Icon: CalendarCheck })),
    ]}
    quickActions={[
      { label: 'View My Assets', path: '/employee/my-assets', Icon: Boxes }, { label: 'Book Shared Resource', path: '/employee/bookings', Icon: CalendarCheck }, { label: 'Raise Maintenance Request', path: '/employee/maintenance', Icon: Wrench }, { label: 'Return or Transfer Asset', path: '/employee/return-transfer-requests', Icon: ArrowRightLeft },
    ]}
  />
}
