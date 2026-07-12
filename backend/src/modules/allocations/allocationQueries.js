const getActiveAllocations = `
  SELECT 
    al.id, al.allocated_date, al.expected_return_date, al.notes,
    a.name as asset_name, a.asset_tag, a.id as asset_id,
    e.first_name, e.last_name, e.id as employee_id,
    d.name as department_name, d.id as department_id
  FROM asset_allocations al
  JOIN assets a ON al.asset_id = a.id
  LEFT JOIN employees e ON al.employee_id = e.id
  LEFT JOIN departments d ON al.department_id = d.id
  WHERE al.organization_id = $1 
    AND al.actual_return_date IS NULL
  ORDER BY al.allocated_date DESC;
`;

const getAvailableAssets = `
  SELECT 
    a.id, a.name, a.asset_tag, s.name as status
  FROM assets a
  JOIN asset_status s ON a.status_id = s.id
  WHERE a.organization_id = $1 
    AND s.name = 'Available'
    AND a.deleted_at IS NULL;
`;

const createAllocation = `
  INSERT INTO asset_allocations (
    organization_id, asset_id, employee_id, department_id, allocated_by, allocated_date, expected_return_date
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7
  ) RETURNING id;
`;

const updateAssetStatus = `
  UPDATE assets 
  SET 
    status_id = (SELECT id FROM asset_status WHERE name = $1 LIMIT 1),
    current_employee_id = $2,
    current_department_id = $3
  WHERE id = $4 AND organization_id = $5;
`;

const returnAllocation = `
  UPDATE asset_allocations
  SET 
    actual_return_date = $1,
    returned_by = $2,
    notes = $3
  WHERE id = $4 AND organization_id = $5
  RETURNING asset_id;
`;

const getTransfers = `
  SELECT 
    t.id, t.status, t.reason, t.transfer_date, t.created_at as requested_on,
    a.name as asset_name, a.asset_tag, a.id as asset_id,
    sd.name as from_department,
    dd.name as to_department, dd.id as to_department_id,
    COALESCE(e.first_name || ' ' || e.last_name, u.email) as requested_by_name
  FROM asset_transfers t
  JOIN assets a ON t.asset_id = a.id
  JOIN departments sd ON t.source_department_id = sd.id
  JOIN departments dd ON t.destination_department_id = dd.id
  JOIN users u ON t.requested_by = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  WHERE t.organization_id = $1
  ORDER BY t.created_at DESC;
`;

const createTransfer = `
  INSERT INTO asset_transfers (
    organization_id, asset_id, source_department_id, destination_department_id, requested_by, status, reason
  ) VALUES (
    $1, $2, $3, $4, $5, 'PENDING', $6
  ) RETURNING id;
`;

const updateTransferStatus = `
  UPDATE asset_transfers
  SET 
    status = $1,
    approved_by = $2,
    transfer_date = $3
  WHERE id = $4 AND organization_id = $5
  RETURNING asset_id, destination_department_id;
`;

const getReturnsHistory = `
  SELECT 
    al.id as return_id, al.actual_return_date as date, al.notes,
    a.name as asset_name, a.asset_tag,
    e.first_name, e.last_name,
    d.name as department_name
  FROM asset_allocations al
  JOIN assets a ON al.asset_id = a.id
  LEFT JOIN employees e ON al.employee_id = e.id
  LEFT JOIN departments d ON al.department_id = d.id
  WHERE al.organization_id = $1 
    AND al.actual_return_date IS NOT NULL
  ORDER BY al.actual_return_date DESC;
`;

// Helper to get active allocation for an asset
const getActiveAllocationByAsset = `
  SELECT id, department_id, employee_id 
  FROM asset_allocations 
  WHERE asset_id = $1 AND actual_return_date IS NULL
  LIMIT 1;
`;

module.exports = {
  getActiveAllocations,
  getAvailableAssets,
  createAllocation,
  updateAssetStatus,
  returnAllocation,
  getTransfers,
  createTransfer,
  updateTransferStatus,
  getReturnsHistory,
  getActiveAllocationByAsset
};
