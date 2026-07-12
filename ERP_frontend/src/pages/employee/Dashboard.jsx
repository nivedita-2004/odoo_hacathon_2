import { useEffect, useState } from 'react'
import { ArrowRightLeft, Boxes, CalendarCheck, CheckCircle2, Clock3, History, RotateCcw, Wrench } from 'lucide-react'
import RoleDashboard from '../../components/dashboard/RoleDashboard'
import useAuth from '../../hooks/useAuth'
import { API_ENDPOINTS } from '../../config/apis'

export default function Dashboard() {
  const { user } = useAuth(); 
  const identity = user?.fullName || user?.email;
  
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallbacks for un-bound modules
  const bookings = [];
  const maintenance = [];
  const returns = [];

  useEffect(() => {
    const token = localStorage.getItem('assetflow_token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [allocRes, assetRes, transferRes] = await Promise.all([
          fetch(API_ENDPOINTS.ALLOCATIONS.BASE, { headers }),
          fetch(API_ENDPOINTS.ASSETS.GET_ALL, { headers }),
          fetch(API_ENDPOINTS.ALLOCATIONS.TRANSFERS, { headers })
        ]);

        const [allocJson, assetJson, transferJson] = await Promise.all([
          allocRes.json(),
          assetRes.json(),
          transferRes.json()
        ]);

        if (allocJson.success) {
          setAllocations(allocJson.data.filter(a => a.employee_id === user.employeeId));
        }
        if (assetJson.success) {
          setAssets(assetJson.data);
        }
        if (transferJson.success) {
          setTransfers(transferJson.data.filter(t => t.from_department === user.department)); 
          // We filter by from_department because transfers don't track requesting employee currently
        }
      } catch (err) {
        console.error("Failed to load employee dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      fetchData();
    }
  }, [user]);

  // Merge allocated assets
  const myAssets = allocations.map(allocation => {
    const asset = assets.find(a => a.asset_tag === allocation.asset_tag) || {};
    return { ...asset, allocation };
  }).filter(item => item.asset_tag);

  const pending = [...maintenance, ...returns, ...transfers].filter((item) => ['PENDING', 'Requested', 'Approved', 'Technician Assigned', 'In Progress'].includes(item.status));

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your dashboard...</div>;

  return <RoleDashboard eyebrow={`Welcome, ${identity}`} description="Track only your allocated assets, bookings, maintenance, return and transfer requests." primaryAction={{ label: 'View My Assets', path: '/employee/my-assets', Icon: Boxes }}
    metrics={[
      { label: 'My Assets', value: myAssets.length, Icon: Boxes, detail: 'Currently allocated to you' }, { label: 'Active Bookings', value: bookings.filter((item) => !['Cancelled', 'Completed'].includes(item.status)).length, Icon: CalendarCheck, detail: 'Your shared resources' },
      { label: 'Pending Requests', value: pending.length, Icon: Clock3, detail: 'Across personal workflows' }, { label: 'Resolved Maintenance', value: maintenance.filter((item) => item.status === 'Resolved').length, Icon: CheckCircle2, detail: 'Completed requests' },
      { label: 'Maintenance Open', value: maintenance.filter((item) => !['Resolved', 'Rejected'].includes(item.status)).length, Icon: Wrench, detail: 'Raised by you' }, { label: 'Return Requests', value: returns.filter((item) => item.status === 'Requested').length, Icon: RotateCcw, detail: 'Awaiting processing' },
      { label: 'Transfer Requests', value: transfers.filter((item) => item.status === 'PENDING').length, Icon: ArrowRightLeft, detail: 'Awaiting approval' }, { label: 'Due Soon', value: allocations.filter((item) => item.expected_return_date).length, Icon: Clock3, detail: 'Assets with return dates' },
    ]}
    overview={{ title: 'My Activity Overview', description: 'Live personal workflow totals.', items: [
      { label: 'Assets Assigned', value: myAssets.length, Icon: Boxes }, { label: 'Bookings Created', value: bookings.length, Icon: CalendarCheck }, { label: 'Requests Completed', value: [...maintenance, ...returns, ...transfers].filter((item) => ['Resolved', 'APPROVED', 'Completed'].includes(item.status)).length, Icon: CheckCircle2 },
      { label: 'Assets Returned', value: 0, Icon: RotateCcw }, { label: 'Issues Reported', value: maintenance.length, Icon: Wrench }, { label: 'Request History', value: maintenance.length + returns.length + transfers.length, Icon: History },
    ] }}
    distribution={{ title: 'My Asset Condition', description: 'Condition of assets currently assigned to you.', items: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'].map((label) => { const value = myAssets.filter((item) => item.condition === label).length; return { label, value: `${value} asset${value === 1 ? '' : 's'}`, percent: Math.max(value ? 8 : 0, myAssets.length ? Math.round((value / myAssets.length) * 100) : 0) } }) }}
    attention={{ title: 'My Pending Items', description: 'Only your own bookings and requests.', items: [
      { label: 'Upcoming Bookings', value: bookings.filter((item) => item.status !== 'Cancelled').length, Icon: CalendarCheck, path: '/employee/bookings' }, { label: 'Maintenance Pending', value: maintenance.filter((item) => item.status === 'Pending').length, Icon: Wrench, path: '/employee/maintenance' },
      { label: 'Maintenance In Progress', value: maintenance.filter((item) => ['Approved', 'Technician Assigned', 'In Progress'].includes(item.status)).length, Icon: Wrench, path: '/employee/maintenance' }, { label: 'Return Requests', value: returns.filter((item) => item.status === 'Requested').length, Icon: RotateCcw, path: '/employee/return-transfer-requests' },
      { label: 'Transfer Requests', value: transfers.filter((item) => item.status === 'PENDING').length, Icon: ArrowRightLeft, path: '/employee/return-transfer-requests' }, { label: 'Allocated Assets', value: myAssets.length, Icon: Boxes, path: '/employee/my-assets' },
    ] }}
    table={{ title: 'My Assigned Assets', description: 'Only assets issued to your employee account.', path: '/employee/my-assets', headers: ['Asset Tag', 'Asset Name', 'Category', 'Assigned On', 'Expected Return', 'Condition', 'Action'], rows: myAssets.map((item) => [item.asset_tag, item.name, item.category_name || 'Uncategorized', new Date(item.allocation.allocated_date).toLocaleDateString('en-IN'), item.allocation.expected_return_date ? new Date(item.allocation.expected_return_date).toLocaleDateString('en-IN') : 'Open allocation', item.condition || 'Not set']) }}
    activity={[
      ...maintenance.slice(-1).map((item) => ({ text: `${item.id} is ${item.status}`, time: item.raisedOn, Icon: Wrench })), ...returns.slice(-1).map((item) => ({ text: `${item.id} is ${item.status}`, time: item.requestedOn, Icon: RotateCcw })),
      ...transfers.slice(-1).map((item) => ({ text: `${item.id} is ${item.status}`, time: item.created_at, Icon: ArrowRightLeft })), ...bookings.slice(-1).map((item) => ({ text: `${item.resource} booking ${item.status || 'confirmed'}`, time: item.date, Icon: CalendarCheck })),
    ]}
    quickActions={[
      { label: 'View My Assets', path: '/employee/my-assets', Icon: Boxes }, { label: 'Book Shared Resource', path: '/employee/bookings', Icon: CalendarCheck }, { label: 'Raise Maintenance Request', path: '/employee/maintenance', Icon: Wrench }, { label: 'Return or Transfer Asset', path: '/employee/return-transfer-requests', Icon: ArrowRightLeft },
    ]}
  />
}
