import { ArrowRightLeft, Boxes, CalendarCheck, ClipboardCheck, PackageCheck, PackageOpen, PackagePlus, RotateCcw, Users, Wrench } from 'lucide-react'
import RoleDashboard from '../../components/dashboard/RoleDashboard'

export default function Dashboard() {
  return <RoleDashboard
    eyebrow="Asset operations"
    title="Asset Manager Dashboard"
    description="Manage asset inventory, allocations, transfers, returns, maintenance and audit assignments."
    primaryAction={{ label: 'Register Asset', path: '/asset-manager/assets/register', Icon: PackagePlus }}
    metrics={[
      { label: 'Total Assets', value: '1,248', Icon: Boxes, detail: 'Across all categories' },
      { label: 'Available Assets', value: '426', Icon: PackageOpen, detail: 'Ready for allocation' },
      { label: 'Allocated Assets', value: '612', Icon: PackageCheck, detail: 'Currently in use' },
      { label: 'Under Maintenance', value: '58', Icon: Wrench, detail: '11 marked high priority' },
      { label: 'Pending Allocations', value: '16', Icon: Users, detail: 'Awaiting processing' },
      { label: 'Pending Transfers', value: '12', Icon: ArrowRightLeft, detail: 'Across departments' },
      { label: 'Return Requests', value: '9', Icon: RotateCcw, detail: '3 overdue' },
      { label: 'Audit Assignments', value: '4', Icon: ClipboardCheck, detail: '2 due this week' },
    ]}
    overview={{ title: 'Operational Overview', description: 'Current workload across core asset operations.', items: [
      { label: 'Assets Added This Month', value: '48', Icon: PackagePlus }, { label: 'Allocations Completed', value: '67', Icon: PackageCheck },
      { label: 'Transfers Completed', value: '21', Icon: ArrowRightLeft }, { label: 'Returns Processed', value: '31', Icon: RotateCcw },
      { label: 'Maintenance Resolved', value: '23', Icon: Wrench }, { label: 'Bookings Today', value: '16', Icon: CalendarCheck },
    ] }}
    distribution={{ title: 'Asset Status Distribution', description: 'Inventory by operational state.', items: [
      { label: 'Available', value: '426', percent: 72 }, { label: 'Allocated', value: '612', percent: 92 }, { label: 'Reserved', value: '74', percent: 36 },
      { label: 'Maintenance', value: '58', percent: 29 }, { label: 'Lost / Retired', value: '50', percent: 20 },
    ] }}
    attention={{ title: 'Pending Operations', description: 'Requests requiring Asset Manager action.', items: [
      { label: 'Allocation Requests', value: '16', Icon: Users, path: '/asset-manager/allocations' },
      { label: 'Transfer Requests', value: '12', Icon: ArrowRightLeft, path: '/asset-manager/transfers' },
      { label: 'Return Requests', value: '9', Icon: RotateCcw, path: '/asset-manager/returns' },
      { label: 'Maintenance Requests', value: '8', Icon: Wrench, path: '/asset-manager/maintenance' },
      { label: 'Upcoming Bookings', value: '16', Icon: CalendarCheck, path: '/asset-manager/bookings' },
      { label: 'Audit Tasks', value: '4', Icon: ClipboardCheck, path: '/asset-manager/audits' },
    ] }}
    table={{ title: 'Recently Registered Assets', description: 'Latest assets added to the organization inventory.', path: '/asset-manager/assets', headers: ['Asset Tag', 'Asset Name', 'Category', 'Location', 'Status', 'Registered On', 'Action'], rows: [
      ['AF-0214', 'Dell Latitude 5450', 'Laptop', 'IT Store', 'Available', '12 Jul 2026'], ['AF-0213', 'Epson EB-X49', 'Projector', 'Operations', 'Available', '12 Jul 2026'],
      ['AF-0212', 'iPhone 15', 'Mobile Device', 'Finance', 'Allocated', '11 Jul 2026'], ['AF-0211', 'Ergo Workstation', 'Furniture', 'Admin Block', 'Available', '11 Jul 2026'],
    ] }}
    activity={[
      { text: 'Asset AF-0214 was registered', time: '10 minutes ago', Icon: PackagePlus }, { text: 'Allocation AL-184 was completed', time: '32 minutes ago', Icon: PackageCheck },
      { text: 'Transfer TR-091 moved to Operations', time: '1 hour ago', Icon: ArrowRightLeft }, { text: 'Maintenance request MR-102 approved', time: '2 hours ago', Icon: Wrench },
    ]}
    quickActions={[
      { label: 'Register New Asset', path: '/asset-manager/assets/register', Icon: PackagePlus }, { label: 'Process Allocations', path: '/asset-manager/allocations', Icon: Users },
      { label: 'Review Transfers', path: '/asset-manager/transfers', Icon: ArrowRightLeft }, { label: 'Open Maintenance Queue', path: '/asset-manager/maintenance', Icon: Wrench },
    ]}
  />
}
