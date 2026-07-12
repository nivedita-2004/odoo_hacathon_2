const getBranches = `
  SELECT id, name, city, address, created_at,
  CASE WHEN deleted_at IS NULL THEN 'Active' ELSE 'Inactive' END as status
  FROM branches WHERE organization_id = $1 ORDER BY created_at ASC;
`;

const getDepartments = `
  SELECT d.id, d.name, d.branch_id, b.name as branch_name, d.head_employee_id, e.first_name, e.last_name,
  CASE WHEN d.deleted_at IS NULL THEN 'Active' ELSE 'Inactive' END as status
  FROM departments d
  LEFT JOIN branches b ON d.branch_id = b.id
  LEFT JOIN employees e ON d.head_employee_id = e.id
  WHERE d.organization_id = $1
  ORDER BY d.created_at ASC;
`;

const getCategories = `
  SELECT id, name, description as fields,
  CASE WHEN deleted_at IS NULL THEN 'Active' ELSE 'Inactive' END as status
  FROM asset_categories WHERE organization_id = $1 ORDER BY created_at ASC;
`;

const getEmployees = `
  SELECT e.id, e.first_name, e.last_name, e.email, e.department_id, d.name as department_name, e.role,
  CASE WHEN e.status = 'ACTIVE' THEN 'Active' ELSE 'Inactive' END as status
  FROM employees e
  LEFT JOIN departments d ON e.department_id = d.id
  WHERE e.organization_id = $1
  ORDER BY e.created_at ASC;
`;

const createBranch = `INSERT INTO branches (organization_id, name, city, address) VALUES ($1, $2, $3, $4) RETURNING *;`;
const updateBranch = `UPDATE branches SET name = $2, city = $3, address = $4, deleted_at = CASE WHEN $5 = 'Inactive' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = $1 AND organization_id = $6 RETURNING *;`;

const createDepartment = `INSERT INTO departments (organization_id, name, branch_id, head_employee_id) VALUES ($1, $2, $3, $4) RETURNING *;`;
const updateDepartment = `UPDATE departments SET name = $2, branch_id = $3, head_employee_id = $4, deleted_at = CASE WHEN $5 = 'Inactive' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = $1 AND organization_id = $6 RETURNING *;`;

const createCategory = `
  WITH new_category AS (
    INSERT INTO asset_categories (organization_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING id, name
  ),
  new_subcategory AS (
    INSERT INTO asset_subcategories (organization_id, category_id, name)
    SELECT $1, id, 'General'
    FROM new_category
  )
  SELECT * FROM new_category;
`;
const updateCategory = `UPDATE asset_categories SET name = $2, description = $3, deleted_at = CASE WHEN $4 = 'Inactive' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = $1 AND organization_id = $5 RETURNING *;`;

const updateEmployee = `UPDATE employees SET first_name = $2, last_name = $3, email = $4, department_id = $5, role = $6, status = CASE WHEN $7 = 'Inactive' THEN 'INACTIVE' ELSE 'ACTIVE' END WHERE id = $1 AND organization_id = $8 RETURNING *;`;
const createEmployee = `INSERT INTO employees (organization_id, first_name, last_name, email, department_id, role, status) VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7 = 'Inactive' THEN 'INACTIVE' ELSE 'ACTIVE' END) RETURNING *;`;

module.exports = {
  getBranches, getDepartments, getCategories, getEmployees,
  createBranch, updateBranch,
  createDepartment, updateDepartment,
  createCategory, updateCategory,
  updateEmployee, createEmployee,
  
  // Roles & Permissions
  getRoles: `SELECT id, name, description, CASE WHEN deleted_at IS NULL THEN 'Active' ELSE 'Inactive' END as status FROM roles WHERE organization_id = $1 ORDER BY created_at ASC;`,
  getPermissions: `SELECT id, name, description FROM permissions ORDER BY name ASC;`,
  getRolePermissions: `SELECT permission_id FROM role_permissions WHERE role_id = $1;`,
  createRole: `INSERT INTO roles (organization_id, name, description) VALUES ($1, $2, $3) RETURNING *;`,
  updateRole: `UPDATE roles SET name = $2, description = $3, deleted_at = CASE WHEN $4 = 'Inactive' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = $1 AND organization_id = $5 RETURNING *;`,
  clearRolePermissions: `DELETE FROM role_permissions WHERE role_id = $1;`,
  addRolePermission: `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2);`,
  createPermission: `INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING *;`,
  checkPermissionExists: `SELECT id FROM permissions WHERE name = $1;`,
  updatePermission: `UPDATE permissions SET description = $2 WHERE name = $1 RETURNING *;`,
  createPendingUser: `INSERT INTO users (organization_id, employee_id, email, password_hash, status) VALUES ($1, $2, $3, $4, 'PENDING_VERIFICATION');`,

  // Branding
  getBranding: `SELECT logo_url, brand_color FROM organizations WHERE id = $1;`,
  updateBranding: `UPDATE organizations SET logo_url = COALESCE($2, logo_url), brand_color = COALESCE($3, brand_color) WHERE id = $1 RETURNING logo_url, brand_color;`,

  // Notifications
  getNotifications: `SELECT id, name, event_trigger, channel, subject_template, body_template FROM notification_templates WHERE organization_id = $1 ORDER BY created_at ASC;`,
  createNotification: `INSERT INTO notification_templates (organization_id, name, event_trigger, channel, subject_template, body_template) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
  updateNotification: `UPDATE notification_templates SET name = $2, event_trigger = $3, channel = $4, subject_template = $5, body_template = $6 WHERE id = $1 AND organization_id = $7 RETURNING *;`,
  deleteNotification: `DELETE FROM notification_templates WHERE id = $1 AND organization_id = $2;`
};
