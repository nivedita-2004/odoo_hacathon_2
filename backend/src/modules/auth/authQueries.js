const getUserByEmail = `
  SELECT 
    u.*, 
    e.first_name, 
    e.last_name, 
    e.department_id,
    CASE 
      WHEN e.role = 'ADMIN' THEN 'ADMIN'
      WHEN EXISTS (SELECT 1 FROM departments d WHERE d.head_employee_id = e.id) THEN 'DEPARTMENT_HEAD'
      ELSE COALESCE(e.role, 'EMPLOYEE')
    END as computed_role
  FROM users u
  LEFT JOIN employees e ON u.employee_id = e.id
  WHERE u.email = $1 AND u.deleted_at IS NULL;
`;

const getUserByEmailAndOrg = `
  SELECT 
    u.*, 
    e.first_name, 
    e.last_name, 
    e.department_id,
    CASE 
      WHEN e.role = 'ADMIN' THEN 'ADMIN'
      WHEN EXISTS (SELECT 1 FROM departments d WHERE d.head_employee_id = e.id) THEN 'DEPARTMENT_HEAD'
      ELSE COALESCE(e.role, 'EMPLOYEE')
    END as computed_role
  FROM users u
  LEFT JOIN employees e ON u.employee_id = e.id
  WHERE u.email = $1 AND u.organization_id = $2 AND u.deleted_at IS NULL;
`;

const getWorkspacesByEmail = `
  SELECT o.id, o.name 
  FROM users u
  JOIN organizations o ON u.organization_id = o.id
  WHERE u.email = $1 AND u.deleted_at IS NULL;
`;

const createOrganization = `
  INSERT INTO organizations (name, billing_email) 
  VALUES ($1, $2) 
  RETURNING id, name;
`;

const createEmployee = `
  INSERT INTO employees (organization_id, first_name, last_name, email, role)
  VALUES ($1, $2, $3, $4, COALESCE($5, 'EMPLOYEE'))
  RETURNING id, first_name, last_name;
`;

const createUser = `
  INSERT INTO users (organization_id, employee_id, email, password_hash, status)
  VALUES ($1, $2, $3, $4, 'ACTIVE')
  RETURNING id, email, status, organization_id, employee_id;
`;

module.exports = {
  getUserByEmail,
  getUserByEmailAndOrg,
  getWorkspacesByEmail,
  createOrganization,
  createEmployee,
  createUser,
};
