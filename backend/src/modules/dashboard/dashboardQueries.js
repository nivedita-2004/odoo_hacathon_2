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

const getNotificationsAllocations = `
  SELECT
    al.id,
    al.allocated_date AS time,
    a.name AS asset_name,
    a.asset_tag,
    COALESCE(e.first_name || ' ' || e.last_name, '') AS employee_name,
    d.name AS department
  FROM asset_allocations al
  JOIN assets a ON al.asset_id = a.id
  LEFT JOIN employees e ON al.employee_id = e.id
  LEFT JOIN departments d ON al.department_id = d.id
  WHERE al.organization_id = $1
    AND al.actual_return_date IS NULL
  ORDER BY al.allocated_date DESC
  LIMIT 20;
`;

const getNotificationsTransfers = `
  SELECT
    t.id,
    COALESCE(t.transfer_date, t.created_at) AS time,
    t.status,
    t.reason,
    a.name AS asset_name,
    a.asset_tag,
    sd.name AS from_department,
    dd.name AS to_department,
    COALESCE(e.first_name || ' ' || e.last_name, u.email, 'Unknown') AS requested_by
  FROM asset_transfers t
  JOIN assets a ON t.asset_id = a.id
  LEFT JOIN users u ON t.requested_by = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  LEFT JOIN departments sd ON t.source_department_id = sd.id
  LEFT JOIN departments dd ON t.destination_department_id = dd.id
  WHERE t.organization_id = $1
  ORDER BY COALESCE(t.transfer_date, t.created_at) DESC
  LIMIT 20;
`;

const getNotificationsReturns = `
  SELECT
    al.id,
    al.actual_return_date AS time,
    a.name AS asset_name,
    a.asset_tag,
    COALESCE(e.first_name || ' ' || e.last_name, u.email, 'Unknown') AS returned_by,
    d.name AS department
  FROM asset_allocations al
  JOIN assets a ON al.asset_id = a.id
  LEFT JOIN users u ON al.returned_by = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  LEFT JOIN departments d ON al.department_id = d.id
  WHERE al.organization_id = $1 AND al.actual_return_date IS NOT NULL
  ORDER BY al.actual_return_date DESC
  LIMIT 20;
`;

const getNotificationsMaintenance = `
  SELECT
    mr.id,
    mr.status,
    mr.priority,
    mr.issue_description,
    mr.created_at AS time,
    a.name AS asset_name,
    a.asset_tag,
    COALESCE(e.first_name || ' ' || e.last_name, u.email, 'Unknown') AS raised_by,
    d.name AS department
  FROM maintenance_requests mr
  JOIN assets a ON mr.asset_id = a.id
  LEFT JOIN users u ON mr.requested_by = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  LEFT JOIN departments d ON e.department_id = d.id
  WHERE mr.organization_id = $1
  ORDER BY mr.created_at DESC
  LIMIT 20;
`;

const getNotificationsBookings = `
  SELECT
    b.id,
    b.title,
    b.status,
    b.start_time AS start_time,
    b.end_time AS end_time,
    a.name AS resource_name,
    COALESCE(e.first_name || ' ' || e.last_name, u.email, 'Unknown') AS booked_by,
    d.name AS department
  FROM bookings b
  JOIN booking_resources br ON b.resource_id = br.id
  JOIN assets a ON br.asset_id = a.id
  LEFT JOIN users u ON b.booked_by = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  LEFT JOIN departments d ON e.department_id = d.id
  WHERE b.organization_id = $1
  ORDER BY b.start_time DESC
  LIMIT 20;
`;

const getNotificationsAudits = `
  SELECT
    aa.id,
    s.name AS audit_name,
    a.name AS asset_name,
    a.asset_tag,
    CASE WHEN aa.status = 'MISSING' THEN 'Missing' WHEN aa.status = 'DAMAGED' THEN 'Damaged' ELSE 'Verified' END AS result,
    COALESCE(e.first_name || ' ' || e.last_name, u.email, 'Unknown') AS checked_by,
    COALESCE(aa.updated_at, aa.created_at, s.created_at) AS time,
    s.id AS audit_id
  FROM audit_assets aa
  JOIN audit_schedules s ON aa.audit_id = s.id
  JOIN assets a ON aa.asset_id = a.id
  LEFT JOIN users u ON aa.scanned_by = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  WHERE s.organization_id = $1
    AND aa.status IN ('MISSING', 'DAMAGED')
  ORDER BY time DESC
  LIMIT 20;
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

const getUserNotificationReads = `
  SELECT notification_id 
  FROM user_notification_reads 
  WHERE user_id = $1
`;

module.exports = {
  getAssets,
  getAllocations,
  getTransfers,
  getBookings,
  getMaintenance,
  getAudits,
  getOverdue,
  getNotificationsAllocations,
  getNotificationsTransfers,
  getNotificationsReturns,
  getNotificationsMaintenance,
  getNotificationsBookings,
  getNotificationsAudits,
  getEmployees,
  getActivityLogs,
  getUserNotificationReads
};
