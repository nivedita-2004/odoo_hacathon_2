const getAudits = `
  SELECT 
    a.id,
    a.name,
    a.department_id,
    d.name as department_name,
    a.scheduled_date,
    a.status,
    a.assigned_to,
    COALESCE(e.first_name || ' ' || e.last_name, u.email) as auditor_name,
    a.created_at,
    (
      SELECT json_agg(
        json_build_object(
          'id', aa.id,
          'asset_id', aa.asset_id,
          'asset_name', ast.name,
          'asset_tag', ast.asset_tag,
          'status', aa.status,
          'notes', aa.notes,
          'scanned_at', aa.scanned_at
        ) ORDER BY ast.asset_tag ASC
      )
      FROM audit_assets aa
      JOIN assets ast ON aa.asset_id = ast.id
      WHERE aa.audit_id = a.id
    ) as items,
    (
      SELECT json_agg(
        json_build_object(
          'id', al.id,
          'action', al.action,
          'date', al.created_at
        ) ORDER BY al.created_at ASC
      )
      FROM audit_logs al
      WHERE al.audit_id = a.id
    ) as history,
    (
      SELECT json_build_object(
        'total_assets', ar.total_assets,
        'found_assets', ar.found_assets,
        'missing_assets', ar.missing_assets,
        'mismatch_assets', ar.mismatch_assets,
        'summary', ar.summary,
        'completed_at', ar.completed_at
      )
      FROM audit_results ar
      WHERE ar.audit_id = a.id
      LIMIT 1
    ) as result
  FROM audit_schedules a
  LEFT JOIN departments d ON a.department_id = d.id
  JOIN users u ON a.assigned_to = u.id
  LEFT JOIN employees e ON u.employee_id = e.id
  WHERE a.organization_id = $1
  ORDER BY a.created_at DESC;
`;

const createAudit = `
  INSERT INTO audit_schedules (
    organization_id, name, department_id, scheduled_date, assigned_to, status, created_by
  ) VALUES (
    $1, $2, $3, $4, $5, 'SCHEDULED', $5
  ) RETURNING id;
`;

const addAuditAsset = `
  INSERT INTO audit_assets (audit_id, asset_id, status, created_by)
  VALUES ($1, $2, 'PENDING', $3);
`;

const updateAuditAssetStatus = `
  UPDATE audit_assets
  SET status = $1, notes = $2, scanned_by = $3, scanned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $4 AND audit_id = $5
  RETURNING id;
`;

const createAuditLog = `
  INSERT INTO audit_logs (audit_id, action, performed_by, created_by)
  VALUES ($1, $2, $3, $3);
`;

const updateAuditStatus = `
  UPDATE audit_schedules
  SET status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
  WHERE id = $3 AND organization_id = $4
  RETURNING id;
`;

const createAuditResult = `
  INSERT INTO audit_results (
    audit_id, total_assets, found_assets, missing_assets, mismatch_assets, completed_at, summary, created_by
  ) VALUES (
    $1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7
  );
`;

const getAssetsByDepartment = `
  SELECT a.id, a.name, a.asset_tag
  FROM assets a
  WHERE a.organization_id = $1
    AND a.current_department_id = $2
    AND a.deleted_at IS NULL;
`;

const getAllOrgAssets = `
  SELECT a.id, a.name, a.asset_tag
  FROM assets a
  WHERE a.organization_id = $1
    AND a.deleted_at IS NULL;
`;

const getEmployeesForAuditor = `
  SELECT u.id as user_id, COALESCE(e.first_name || ' ' || e.last_name, u.email) as name
  FROM users u
  LEFT JOIN employees e ON u.employee_id = e.id
  WHERE u.organization_id = $1;
`;

module.exports = {
  getAudits,
  createAudit,
  addAuditAsset,
  updateAuditAssetStatus,
  createAuditLog,
  updateAuditStatus,
  createAuditResult,
  getAssetsByDepartment,
  getAllOrgAssets,
  getEmployeesForAuditor
};
