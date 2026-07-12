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
  updateUserPassword: `UPDATE users SET password_hash = $1 WHERE id = $2`,
  createPendingUserNoOrg: `INSERT INTO users (employee_id, email, password_hash, status) VALUES ($1, $2, $3, 'PENDING_VERIFICATION') RETURNING id`,
  deleteUserOTP: `DELETE FROM otp WHERE user_id = $1`,
  createUserOTP: `INSERT INTO otp (user_id, code, expires_at) VALUES ($1, $2, $3)`,
  getPendingUserByEmail: `SELECT * FROM users WHERE email = $1 AND status = 'PENDING_VERIFICATION'`,
  getValidOTP: `SELECT * FROM otp WHERE user_id = $1 AND code = $2 AND used = false AND expires_at > CURRENT_TIMESTAMP`,
  markOTPUsed: `UPDATE otp SET used = true WHERE id = $1`,
  activateUser: `UPDATE users SET status = 'ACTIVE' WHERE id = $1`,
  getUserWithEmployeeByEmail: `SELECT u.*, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.email = $1 AND u.deleted_at IS NULL LIMIT 1`,
  updateEmployeeOrg: `UPDATE employees SET organization_id = $1 WHERE id = $2`,
  updateUserEmployeeId: `UPDATE users SET employee_id = $1 WHERE id = $2`,
  updateUserOrg: `UPDATE users SET organization_id = $1 WHERE id = $2`
};
