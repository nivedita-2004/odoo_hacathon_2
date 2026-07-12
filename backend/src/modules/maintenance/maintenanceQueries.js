const getRequests = `
  SELECT 
    mr.id as request_id,
    mr.asset_id,
    a.name as asset_name,
    a.asset_tag,
    s.name as asset_status,
    mr.priority,
    mr.issue_description,
    mr.photo_url,
    mr.status,
    mr.created_at,
    COALESCE(e.first_name || ' ' || e.last_name, u.email) as raised_by_name,
    COALESCE(te.first_name || ' ' || te.last_name, '') as technician_name,
    (
      SELECT json_agg(
        json_build_object(
          'id', ml.id,
          'event', ml.log_entry,
          'date', ml.created_at
        ) ORDER BY ml.created_at ASC
      )
      FROM maintenance_logs ml
      WHERE ml.request_id = mr.id
    ) as history
  FROM maintenance_requests mr
  JOIN assets a ON mr.asset_id = a.id
  JOIN asset_status s ON a.status_id = s.id
  JOIN users u ON mr.requested_by = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  LEFT JOIN maintenance_tasks mt ON mt.request_id = mr.id
  LEFT JOIN maintenance_engineers me ON mt.assigned_engineer_id = me.id
  LEFT JOIN employees te ON me.employee_id = te.id
  WHERE mr.organization_id = $1
  ORDER BY mr.created_at DESC;
`;

const getEngineers = `
  SELECT 
    me.id as engineer_id,
    e.first_name || ' ' || e.last_name as name,
    e.email
  FROM maintenance_engineers me
  JOIN employees e ON me.employee_id = e.id
  WHERE me.organization_id = $1;
`;

const getEmployees = `
  SELECT id, first_name || ' ' || last_name as name, email
  FROM employees
  WHERE organization_id = $1;
`;

const createEngineer = `
  INSERT INTO maintenance_engineers (organization_id, employee_id, created_by)
  VALUES ($1, $2, $3)
  RETURNING id;
`;

const createRequest = `
  INSERT INTO maintenance_requests (
    organization_id, asset_id, requested_by, priority, issue_description, photo_url, status, created_by
  ) VALUES (
    $1, $2, $3, $4, $5, $6, 'Pending', $3
  ) RETURNING id;
`;

const updateRequestStatus = `
  UPDATE maintenance_requests
  SET status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
  WHERE id = $3 AND organization_id = $4
  RETURNING id, asset_id;
`;

const getAssetStatusId = `
  SELECT id FROM asset_status WHERE name = $1 AND organization_id = $2 LIMIT 1;
`;

const updateAssetStatus = `
  UPDATE assets
  SET status_id = $1, updated_at = CURRENT_TIMESTAMP
  WHERE id = $2 AND organization_id = $3;
`;

const createLog = `
  INSERT INTO maintenance_logs (
    organization_id, request_id, task_id, log_entry, logged_by, created_by
  ) VALUES (
    $1, $2, $3, $4, $5, $5
  );
`;

const createTask = `
  INSERT INTO maintenance_tasks (
    organization_id, request_id, asset_id, task_type, assigned_engineer_id, status, created_by
  ) VALUES (
    $1, $2, $3, 'Repair', $4, 'PENDING', $5
  ) RETURNING id;
`;

module.exports = {
  getRequests,
  getEngineers,
  getEmployees,
  createEngineer,
  createRequest,
  updateRequestStatus,
  getAssetStatusId,
  updateAssetStatus,
  createLog,
  createTask
};
