import ResourceBookings from '../admin/ResourceBookings'
import useAuth from '../../hooks/useAuth'

export default function Bookings() {
  const { user } = useAuth()
  return <ResourceBookings scopeDepartment={user?.department || 'Unassigned'} scopeBookedBy={user?.fullName || user?.email} />
}
