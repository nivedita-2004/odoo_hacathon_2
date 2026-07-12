import { ArrowRightLeft, Boxes, CalendarCheck, CheckCircle2, Clock3, History, PackagePlus, RotateCcw, Wrench } from 'lucide-react'
import RoleDashboard from '../../components/dashboard/RoleDashboard'

export default function Dashboard() {
  return <RoleDashboard
    eyebrow="My workspace"
    title="Employee Dashboard"
    description="View your assigned assets, requests, resource bookings, maintenance and return status."
    primaryAction={{ label: 'Request Asset', path: '/employee/request-asset', Icon: PackagePlus }}
    metrics={[
      { label: 'My Assets', value: '5', Icon: Boxes, detail: '4 in good condition' }, { label: 'Active Bookings', value: '2', Icon: CalendarCheck, detail: 'Next booking at 11 AM' },
      { label: 'Pending Requests', value: '2', Icon: Clock3, detail: 'Awaiting approval' }, { label: 'Approved Requests', value: '8', Icon: CheckCircle2, detail: 'This financial year' },
      { label: 'Maintenance Requests', value: '1', Icon: Wrench, detail: 'Currently in progress' }, { label: 'Return Requests', value: '1', Icon: RotateCcw, detail: 'Pickup scheduled' },
      { label: 'Transfer Requests', value: '0', Icon: ArrowRightLeft, detail: 'No pending transfer' }, { label: 'Due Soon', value: '1', Icon: Clock3, detail: 'Return due in 3 days' },
    ]}
    overview={{ title: 'My Activity Overview', description: 'Your requests and asset activity this month.', items: [
      { label: 'Assets Assigned', value: '5', Icon: Boxes }, { label: 'Requests Submitted', value: '3', Icon: PackagePlus }, { label: 'Requests Approved', value: '2', Icon: CheckCircle2 },
      { label: 'Bookings Completed', value: '6', Icon: CalendarCheck }, { label: 'Assets Returned', value: '1', Icon: RotateCcw }, { label: 'Issues Reported', value: '1', Icon: Wrench },
    ] }}
    distribution={{ title: 'My Asset Condition', description: 'Condition of assets currently assigned to you.', items: [
      { label: 'Excellent', value: '2 assets', percent: 80 }, { label: 'Good', value: '2 assets', percent: 80 }, { label: 'Fair', value: '1 asset', percent: 40 },
      { label: 'Under Maintenance', value: '0 assets', percent: 5 }, { label: 'Return Due Soon', value: '1 asset', percent: 40 },
    ] }}
    attention={{ title: 'My Pending Items', description: 'Requests, bookings and returns requiring your attention.', items: [
      { label: 'Pending Asset Requests', value: '2', Icon: PackagePlus, path: '/employee/request-asset' }, { label: 'Upcoming Bookings', value: '2', Icon: CalendarCheck, path: '/employee/my-bookings' },
      { label: 'Maintenance In Progress', value: '1', Icon: Wrench, path: '/employee/maintenance' }, { label: 'Return Due Soon', value: '1', Icon: RotateCcw, path: '/employee/return-requests' },
      { label: 'Transfer Requests', value: '0', Icon: ArrowRightLeft, path: '/employee/transfer-requests' }, { label: 'Request History', value: '12', Icon: History, path: '/employee/my-assets' },
    ] }}
    table={{ title: 'My Assigned Assets', description: 'Assets currently issued to your employee account.', path: '/employee/my-assets', headers: ['Asset Tag', 'Asset Name', 'Category', 'Assigned On', 'Expected Return', 'Condition', 'Action'], rows: [
      ['AF-0114', 'Dell Latitude 5440', 'Laptop', '02 Jul 2026', 'Open allocation', 'Good'], ['AF-0138', 'LG UltraWide 29', 'Monitor', '18 May 2026', 'Open allocation', 'Excellent'],
      ['AF-0172', 'iPhone 15', 'Mobile Device', '14 Apr 2026', '15 Jul 2026', 'Good'], ['AF-0189', 'Logitech MX Keys', 'Accessory', '14 Apr 2026', 'Open allocation', 'Excellent'],
    ] }}
    activity={[
      { text: 'Meeting Room B2 booking confirmed', time: '15 minutes ago', Icon: CalendarCheck }, { text: 'Asset request AR-228 submitted', time: 'Yesterday', Icon: PackagePlus },
      { text: 'Maintenance request MR-118 moved in progress', time: '2 days ago', Icon: Wrench }, { text: 'Return request RR-045 pickup scheduled', time: '3 days ago', Icon: RotateCcw },
    ]}
    quickActions={[
      { label: 'Request an Asset', path: '/employee/request-asset', Icon: PackagePlus }, { label: 'Book a Resource', path: '/employee/book-resource', Icon: CalendarCheck },
      { label: 'Raise Maintenance Request', path: '/employee/maintenance', Icon: Wrench }, { label: 'Request Asset Return', path: '/employee/return-requests', Icon: RotateCcw },
    ]}
  />
}
