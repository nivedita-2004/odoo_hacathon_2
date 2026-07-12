import { ArrowRightLeft, Boxes, CalendarCheck, ClipboardCheck, PackageCheck, PackagePlus, RotateCcw, UserCheck, Users, Wrench } from 'lucide-react'
import RoleDashboard from '../../components/dashboard/RoleDashboard'

export default function Dashboard() {
  return <RoleDashboard
    eyebrow="Information Technology Department"
    title="Department Head Dashboard"
    description="Monitor department assets, employees, requests, bookings, maintenance and audit readiness."
    primaryAction={{ label: 'Review Requests', path: '/department-head/allocation-requests', Icon: UserCheck }}
    metrics={[
      { label: 'Department Assets', value: '220', Icon: Boxes, detail: 'Across 8 categories' }, { label: 'Department Employees', value: '46', Icon: Users, detail: '43 active employees' },
      { label: 'Allocated Assets', value: '184', Icon: PackageCheck, detail: '84% utilization' }, { label: 'Available Assets', value: '21', Icon: Boxes, detail: 'Ready for assignment' },
      { label: 'Allocation Requests', value: '7', Icon: PackagePlus, detail: 'Awaiting review' }, { label: 'Transfer Requests', value: '4', Icon: ArrowRightLeft, detail: '2 need approval' },
      { label: 'Maintenance Cases', value: '9', Icon: Wrench, detail: '2 high priority' }, { label: 'Audit Assignments', value: '2', Icon: ClipboardCheck, detail: 'Next audit in 5 days' },
    ]}
    overview={{ title: 'Department Overview', description: 'Key department activity for the current month.', items: [
      { label: 'New Employees', value: '5', Icon: Users }, { label: 'Assets Allocated', value: '18', Icon: PackageCheck }, { label: 'Requests Approved', value: '14', Icon: UserCheck },
      { label: 'Assets Returned', value: '7', Icon: RotateCcw }, { label: 'Maintenance Resolved', value: '6', Icon: Wrench }, { label: 'Bookings This Week', value: '22', Icon: CalendarCheck },
    ] }}
    distribution={{ title: 'Assets by Category', description: 'Department inventory composition.', items: [
      { label: 'Laptops', value: '96', percent: 92 }, { label: 'Monitors', value: '54', percent: 68 }, { label: 'Mobile Devices', value: '31', percent: 46 },
      { label: 'Networking', value: '24', percent: 38 }, { label: 'Other Equipment', value: '15', percent: 25 },
    ] }}
    attention={{ title: 'Items Requiring Review', description: 'Department requests and exceptions requiring attention.', items: [
      { label: 'Allocation Requests', value: '7', Icon: PackagePlus, path: '/department-head/allocation-requests' }, { label: 'Transfer Requests', value: '4', Icon: ArrowRightLeft, path: '/department-head/transfer-requests' },
      { label: 'Maintenance Cases', value: '9', Icon: Wrench, path: '/department-head/maintenance' }, { label: 'Upcoming Bookings', value: '11', Icon: CalendarCheck, path: '/department-head/bookings' },
      { label: 'Audit Tasks', value: '2', Icon: ClipboardCheck, path: '/department-head/audits' }, { label: 'Unassigned Employees', value: '3', Icon: Users, path: '/department-head/employees' },
    ] }}
    table={{ title: 'Department Asset Assignments', description: 'Recently assigned and actively used department assets.', path: '/department-head/assets', headers: ['Asset Tag', 'Asset Name', 'Employee', 'Category', 'Assigned On', 'Condition', 'Action'], rows: [
      ['AF-0114', 'Dell Latitude 5440', 'Priya Sharma', 'Laptop', '02 Jul 2026', 'Good'], ['AF-0108', 'LG UltraWide 29', 'Rahul Verma', 'Monitor', '29 Jun 2026', 'Good'],
      ['AF-0092', 'Cisco Catalyst 9200', 'Network Team', 'Networking', '21 Jun 2026', 'Excellent'], ['AF-0078', 'iPhone 14', 'Neha Kapoor', 'Mobile Device', '16 Jun 2026', 'Fair'],
    ] }}
    activity={[
      { text: 'Allocation request AR-221 approved', time: '20 minutes ago', Icon: UserCheck }, { text: 'Laptop AF-0114 assigned to Priya', time: '1 hour ago', Icon: PackageCheck },
      { text: 'Transfer request TR-094 submitted', time: '2 hours ago', Icon: ArrowRightLeft }, { text: 'Department audit checklist updated', time: 'Yesterday', Icon: ClipboardCheck },
    ]}
    quickActions={[
      { label: 'Review Allocation Requests', path: '/department-head/allocation-requests', Icon: PackagePlus }, { label: 'Review Transfer Requests', path: '/department-head/transfer-requests', Icon: ArrowRightLeft },
      { label: 'View Department Employees', path: '/department-head/employees', Icon: Users }, { label: 'Check Audit Assignments', path: '/department-head/audits', Icon: ClipboardCheck },
    ]}
  />
}
