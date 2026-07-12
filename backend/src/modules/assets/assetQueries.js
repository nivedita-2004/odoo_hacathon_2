const getMetadata = `
  SELECT
    (SELECT json_agg(row_to_json(s)) FROM (SELECT id, name, color_code FROM asset_status WHERE is_active = true) s) as statuses,
    (SELECT json_agg(row_to_json(c)) FROM (SELECT id, name, score FROM asset_condition) c) as conditions,
    (SELECT json_agg(row_to_json(b)) FROM (SELECT id, name FROM branches WHERE organization_id = $1 AND deleted_at IS NULL) b) as branches,
    (SELECT json_agg(row_to_json(d)) FROM (SELECT id, name, branch_id FROM departments WHERE organization_id = $1 AND deleted_at IS NULL) d) as departments,
    (SELECT json_agg(row_to_json(e)) FROM (SELECT id, first_name, last_name, email FROM employees WHERE organization_id = $1 AND status = 'ACTIVE') e) as employees,
    (SELECT json_agg(row_to_json(cat)) FROM (
      SELECT c.id, c.name, (
        SELECT json_agg(row_to_json(sub)) FROM (
          SELECT id, name FROM asset_subcategories WHERE category_id = c.id AND deleted_at IS NULL
        ) sub
      ) as subcategories
      FROM asset_categories c WHERE c.organization_id = $1 AND c.deleted_at IS NULL
    ) cat) as categories;
`;

const getAssets = `
  SELECT 
    a.id, a.name, a.asset_tag, a.serial_number, a.purchase_cost, a.purchase_date,
    c.name as category_name,
    sc.name as subcategory_name,
    s.name as status,
    s.color_code as status_color,
    cond.name as condition,
    d.name as department_name,
    e.first_name, e.last_name,
    q.qr_image_url as qr_code_url
  FROM assets a
  LEFT JOIN asset_subcategories sc ON a.subcategory_id = sc.id
  LEFT JOIN asset_categories c ON sc.category_id = c.id
  LEFT JOIN asset_status s ON a.status_id = s.id
  LEFT JOIN asset_condition cond ON a.condition_id = cond.id
  LEFT JOIN departments d ON a.current_department_id = d.id
  LEFT JOIN employees e ON a.current_employee_id = e.id
  LEFT JOIN asset_qr_codes q ON a.id = q.asset_id
  WHERE a.organization_id = $1 AND a.deleted_at IS NULL
  ORDER BY a.created_at DESC;
`;

const getAssetById = `
  SELECT 
    a.*,
    c.name as category_name,
    sc.name as subcategory_name,
    s.name as status,
    s.color_code as status_color,
    cond.name as condition,
    d.name as department_name,
    e.first_name, e.last_name,
    q.qr_image_url as qr_code_url
  FROM assets a
  LEFT JOIN asset_subcategories sc ON a.subcategory_id = sc.id
  LEFT JOIN asset_categories c ON sc.category_id = c.id
  LEFT JOIN asset_status s ON a.status_id = s.id
  LEFT JOIN asset_condition cond ON a.condition_id = cond.id
  LEFT JOIN departments d ON a.current_department_id = d.id
  LEFT JOIN employees e ON a.current_employee_id = e.id
  LEFT JOIN asset_qr_codes q ON a.id = q.asset_id
  WHERE a.id = $1 AND a.organization_id = $2 AND a.deleted_at IS NULL;
`;

const createAsset = `
  INSERT INTO assets (
    organization_id, name, asset_tag, serial_number, subcategory_id, 
    status_id, condition_id, purchase_cost, purchase_date, current_department_id, current_employee_id
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
  ) RETURNING id;
`;

const saveQRCode = `
  INSERT INTO asset_qr_codes (organization_id, asset_id, qr_data, qr_image_url) VALUES ($1, $2, $3, $4) RETURNING id;
`;

const getSubcategoryLimitOne = `
  SELECT id FROM asset_subcategories WHERE category_id = $1 LIMIT 1
`;

module.exports = {
  getMetadata,
  getAssets,
  getAssetById,
  createAsset,
  saveQRCode,
  getSubcategoryLimitOne
};
