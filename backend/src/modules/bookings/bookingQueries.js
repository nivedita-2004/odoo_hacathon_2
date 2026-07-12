const getBookableResources = `
  SELECT 
    br.id as resource_id,
    br.asset_id,
    a.name as asset_name,
    a.asset_tag,
    br.max_duration_hours,
    br.requires_approval
  FROM booking_resources br
  JOIN assets a ON br.asset_id = a.id
  WHERE br.organization_id = $1 
    AND br.is_bookable = true
    AND a.deleted_at IS NULL
  ORDER BY a.name ASC;
`;

const addResource = `
  INSERT INTO booking_resources (
    organization_id, asset_id, max_duration_hours, requires_approval, is_bookable, created_by
  ) VALUES (
    $1, $2, $3, $4, true, $5
  ) RETURNING id;
`;

const getBookings = `
  SELECT 
    b.id,
    b.title,
    b.start_time,
    b.end_time,
    b.status,
    b.reminder_minutes,
    a.name as resource_name,
    br.id as resource_id,
    COALESCE(e.first_name || ' ' || e.last_name, u.email) as booked_by_name,
    b.booked_by as booked_by_user_id,
    d.name as department_name
  FROM bookings b
  JOIN booking_resources br ON b.resource_id = br.id
  JOIN assets a ON br.asset_id = a.id
  JOIN users u ON b.booked_by = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  LEFT JOIN departments d ON e.department_id = d.id
  WHERE b.organization_id = $1
    AND b.start_time >= $2
    AND b.end_time <= $3
  ORDER BY b.start_time ASC;
`;

const checkOverlap = `
  SELECT id FROM bookings 
  WHERE resource_id = $1 
    AND status != 'Cancelled'
    AND start_time < $3 
    AND end_time > $2
    AND ($4::uuid IS NULL OR id != $4)
  LIMIT 1;
`;

const createBooking = `
  INSERT INTO bookings (
    organization_id, resource_id, title, booked_by, start_time, end_time, reminder_minutes, status, created_by
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, 'CONFIRMED', $4
  ) RETURNING id;
`;

const updateBooking = `
  UPDATE bookings
  SET 
    title = $1,
    start_time = $2,
    end_time = $3,
    reminder_minutes = $4,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = $5
  WHERE id = $6 AND organization_id = $7
  RETURNING id;
`;

const cancelBooking = `
  UPDATE bookings
  SET 
    status = 'Cancelled',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = $1
  WHERE id = $2 AND organization_id = $3
  RETURNING id;
`;

const checkAssetExists = `
  SELECT id FROM assets 
  WHERE id = $1 AND organization_id = $2
`;

const checkResourceExists = `
  SELECT id FROM booking_resources 
  WHERE asset_id = $1
`;

module.exports = {
  getBookableResources,
  addResource,
  getBookings,
  checkOverlap,
  createBooking,
  updateBooking,
  cancelBooking,
  checkAssetExists,
  checkResourceExists
};
