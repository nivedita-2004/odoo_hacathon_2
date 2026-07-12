const getAssets = `
  SELECT 
    a.id, 
    a.name, 
    a.asset_tag, 
    s.name as status
  FROM assets a
  LEFT JOIN asset_status s ON a.status_id = s.id
  WHERE a.deleted_at IS NULL AND a.organization_id = $1;
`;

const getAllocations = `
  SELECT 
    al.id, 
    'Active' as status,
    d.name as department,
    al.expected_return_date as "expectedReturn"
  FROM asset_allocations al
  LEFT JOIN departments d ON al.department_id = d.id
  WHERE al.actual_return_date IS NULL AND al.organization_id = $1;
`;

const getTransfers = `
  SELECT 
    id, 
    CASE WHEN status = 'PENDING' THEN 'Requested' ELSE status END as status
  FROM asset_transfers
  WHERE organization_id = $1;
`;

const getBookings = `
  SELECT 
    b.id, 
    b.status,
    b.start_time::date::text as date,
    a.name as resource
  FROM bookings b
  LEFT JOIN booking_resources br ON b.resource_id = br.id
  LEFT JOIN assets a ON br.asset_id = a.id
  WHERE b.organization_id = $1;
`;

const getMaintenance = `
  SELECT 
    id, 
    CASE WHEN status = 'PENDING' THEN 'Pending' WHEN status = 'IN_PROGRESS' THEN 'In Progress' WHEN status = 'RESOLVED' THEN 'Resolved' ELSE status END as status,
    priority
  FROM maintenance_requests
  WHERE organization_id = $1;
`;

const getAudits = `
  SELECT 
    s.id, 
    CASE WHEN s.status = 'OPEN' THEN 'Open' ELSE 'Closed' END as status,
    COALESCE(
      json_agg(
        json_build_object('result', CASE WHEN a.status = 'MISSING' THEN 'Missing' WHEN a.status = 'DAMAGED' THEN 'Damaged' ELSE 'Verified' END)
      ) FILTER (WHERE a.id IS NOT NULL), 
      '[]'
    ) as items
  FROM audit_schedules s
  LEFT JOIN audit_assets a ON s.id = a.audit_id
  WHERE s.organization_id = $1
  GROUP BY s.id, s.status;
`;

const getOverdue = `
  SELECT 
    a.asset_tag as "assetTag",
    a.name as "assetName",
    e.first_name || ' ' || e.last_name as holder,
    d.name as department,
    al.expected_return_date::text as "expectedReturn"
  FROM asset_allocations al
  JOIN assets a ON al.asset_id = a.id
  LEFT JOIN employees e ON al.employee_id = e.id
  LEFT JOIN departments d ON al.department_id = d.id
  WHERE al.expected_return_date < CURRENT_TIMESTAMP AND al.actual_return_date IS NULL AND al.organization_id = $1;
`;

const getEmployees = `
  SELECT id, status FROM employees WHERE organization_id = $1;
`;

const getActivityLogs = `
  SELECT 
    a.action,
    a.entity_type as module,
    e.first_name || ' ' || e.last_name as user_name,
    a.created_at
  FROM activity_logs a
  LEFT JOIN users u ON a.user_id = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  WHERE a.organization_id = $1
  ORDER BY a.created_at DESC
  LIMIT 5;
`;

module.exports = {
  getAssets,
  getAllocations,
  getTransfers,
  getBookings,
  getMaintenance,
  getAudits,
  getOverdue,
  getEmployees,
  getActivityLogs
};
