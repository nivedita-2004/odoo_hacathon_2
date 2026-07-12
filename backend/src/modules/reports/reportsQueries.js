const getAssetsByStatus = `
  SELECT s.name as status, COUNT(*) as count
  FROM assets a
  JOIN asset_status s ON a.status_id = s.id
  WHERE a.organization_id = $1 AND a.deleted_at IS NULL
  GROUP BY s.name
`;

const getDepartmentAllocation = `
  SELECT d.name, COUNT(a.id) as value
  FROM assets a
  JOIN departments d ON a.current_department_id = d.id
  WHERE a.organization_id = $1 AND a.deleted_at IS NULL
  GROUP BY d.name
  ORDER BY value DESC
`;

const getMaintenanceStats = `
  SELECT 
    mr.status,
    COUNT(*) as count
  FROM maintenance_requests mr
  WHERE mr.organization_id = $1
  GROUP BY mr.status
`;

const getActiveBookings = `
  SELECT COUNT(*) as count
  FROM bookings
  WHERE organization_id = $1
    AND status != 'Cancelled'
    AND end_time > NOW()
`;

const getActiveAllocations = `
  SELECT COUNT(*) as count
  FROM asset_allocations
  WHERE organization_id = $1
    AND actual_return_date IS NULL
`;

const getMaintenanceByPriority = `
  SELECT 
    mr.priority as category,
    COUNT(*) as requests,
    COUNT(*) FILTER (WHERE mr.status = 'Resolved') as resolved
  FROM maintenance_requests mr
  WHERE mr.organization_id = $1
  GROUP BY mr.priority
  ORDER BY requests DESC
`;

const getAssetUsage = `
  SELECT 
    ast.name, 
    COUNT(b.id) as uses,
    CASE WHEN COUNT(b.id) > 2 THEN 'Most Used' ELSE 'Idle' END as type
  FROM booking_resources br
  JOIN assets ast ON br.asset_id = ast.id
  LEFT JOIN bookings b ON b.resource_id = br.id AND b.status != 'Cancelled'
  WHERE br.organization_id = $1
  GROUP BY ast.name
  ORDER BY uses DESC
  LIMIT 10
`;

const getBookingHeatmap = `
  SELECT 
    EXTRACT(DOW FROM start_time) as dow,
    EXTRACT(HOUR FROM start_time) as hour,
    COUNT(*) as count
  FROM bookings
  WHERE organization_id = $1 AND status != 'Cancelled'
  GROUP BY dow, hour
  ORDER BY dow, hour
`;

const getUtilizationTrend = `
  SELECT 
    TO_CHAR(date_trunc('month', al.allocated_date), 'Mon') as month,
    COUNT(DISTINCT al.asset_id) as allocated
  FROM asset_allocations al
  WHERE al.organization_id = $1
    AND al.allocated_date >= NOW() - INTERVAL '7 months'
  GROUP BY date_trunc('month', al.allocated_date)
  ORDER BY date_trunc('month', al.allocated_date)
`;

const getWatchlist = `
  SELECT 
    a.asset_tag,
    a.name,
    s.name as status,
    d.name as department
  FROM assets a
  JOIN asset_status s ON a.status_id = s.id
  LEFT JOIN departments d ON a.current_department_id = d.id
  WHERE a.organization_id = $1
    AND a.deleted_at IS NULL
    AND s.name IN ('Under Maintenance', 'Disposed', 'Lost')
  ORDER BY a.updated_at DESC
  LIMIT 10
`;

const getAllAssets = `
  SELECT 
    a.asset_tag, a.name, s.name as status,
    d.name as department
  FROM assets a
  JOIN asset_status s ON a.status_id = s.id
  LEFT JOIN departments d ON a.current_department_id = d.id
  WHERE a.organization_id = $1 AND a.deleted_at IS NULL
  ORDER BY a.asset_tag
`;

module.exports = {
  getAssetsByStatus,
  getDepartmentAllocation,
  getMaintenanceStats,
  getActiveBookings,
  getActiveAllocations,
  getMaintenanceByPriority,
  getAssetUsage,
  getBookingHeatmap,
  getUtilizationTrend,
  getWatchlist,
  getAllAssets
};
