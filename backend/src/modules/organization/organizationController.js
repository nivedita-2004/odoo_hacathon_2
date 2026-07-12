const db = require('../../config/db');
const queries = require('./organizationQueries');
const { sendWelcomeEmail } = require('../../utils/emailService');

const getSetup = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const [branches, departments, categories, employees] = await Promise.all([
      db.query(queries.getBranches, [orgId]),
      db.query(queries.getDepartments, [orgId]),
      db.query(queries.getCategories, [orgId]),
      db.query(queries.getEmployees, [orgId])
    ]);

    res.status(200).json({
      success: true,
      data: {
        branches: branches.rows.map(b => ({ ...b, id: b.id })),
        departments: departments.rows.map(d => ({
          id: d.id,
          name: d.name,
          branch_id: d.branch_id,
          branch: d.branch_name,
          head_id: d.head_employee_id,
          head: d.first_name ? `${d.first_name} ${d.last_name}` : '',
          status: d.status
        })),
        categories: categories.rows,
        employees: employees.rows.map(e => ({
          id: e.id,
          name: `${e.first_name} ${e.last_name}`,
          email: e.email,
          department_id: e.department_id,
          department: e.department_name,
          role: e.role,
          status: e.status
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching org setup:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const saveBranch = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { id, name, city, address, status } = req.body;
    let result;
    if (id && !id.startsWith('new_')) {
      result = await db.query(queries.updateBranch, [id, name, city || null, address || null, status, orgId]);
    } else {
      result = await db.query(queries.createBranch, [orgId, name, city || null, address || null]);
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const saveDepartment = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { id, name, branch_id, head_id, status } = req.body;
    let result;
    if (id && !id.startsWith('new_')) {
      result = await db.query(queries.updateDepartment, [id, name, branch_id || null, head_id || null, status, orgId]);
    } else {
      result = await db.query(queries.createDepartment, [orgId, name, branch_id || null, head_id || null]);
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const saveCategory = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { id, name, fields, status } = req.body;
    let result;
    if (id && !id.startsWith('new_')) {
      result = await db.query(queries.updateCategory, [id, name, fields || null, status, orgId]);
    } else {
      result = await db.query(queries.createCategory, [orgId, name, fields || null]);
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


const saveEmployee = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const orgId = req.user.organization_id;
    const { id, name, email, department_id, role, status } = req.body;
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const cleanEmail = email.trim().toLowerCase();

    await client.query('BEGIN');
    
    let result;
    if (id && !id.startsWith('new_')) {
      result = await client.query(queries.updateEmployee, [id, firstName, lastName, cleanEmail, department_id || null, role || 'EMPLOYEE', status, orgId]);
    } else {
      result = await client.query(queries.createEmployee, [orgId, firstName, lastName, cleanEmail, department_id || null, role || 'EMPLOYEE', status]);
      const employeeId = result.rows[0].id;

      // Create PENDING user record for hassle-free login
      await client.query(
        queries.createPendingUser,
        [orgId, employeeId, cleanEmail, 'temp_hash_' + Date.now()]
      );

      // Send the beautiful invite email asynchronously
      sendWelcomeEmail(cleanEmail, firstName).catch(console.error);
    }
    
    await client.query('COMMIT');
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'An employee with this email already exists in this organization.' });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const getSaaSSetup = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const [roles, permissions, branding, notifications] = await Promise.all([
      db.query(queries.getRoles, [orgId]),
      db.query(queries.getPermissions),
      db.query(queries.getBranding, [orgId]),
      db.query(queries.getNotifications, [orgId])
    ]);

    // Fetch permissions for each role
    const rolesWithPerms = await Promise.all(roles.rows.map(async (role) => {
      const perms = await db.query(queries.getRolePermissions, [role.id]);
      return { ...role, permissions: perms.rows.map(p => p.permission_id) };
    }));

    res.status(200).json({
      success: true,
      data: {
        roles: rolesWithPerms,
        permissions: permissions.rows,
        branding: branding.rows[0] || { logo_url: '', brand_color: '' },
        notifications: notifications.rows
      }
    });
  } catch (error) {
    console.error('Error fetching SaaS setup:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const saveRole = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const orgId = req.user.organization_id;
    const { id, name, description, status, permissions } = req.body;
    await client.query('BEGIN');
    
    let roleId = id;
    let result;
    if (id && !id.startsWith('new_')) {
      result = await client.query(queries.updateRole, [id, name, description || null, status, orgId]);
    } else {
      result = await client.query(queries.createRole, [orgId, name, description || null]);
      roleId = result.rows[0].id;
    }

    // Update permissions
    await client.query(queries.clearRolePermissions, [roleId]);
    if (permissions && permissions.length > 0) {
      for (const permId of permissions) {
        await client.query(queries.addRolePermission, [roleId, permId]);
      }
    }
    
    await client.query('COMMIT');
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const saveBranding = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { logo_url, brand_color } = req.body;
    // Allow Cloudinary upload or direct URL string
    const finalLogoUrl = req.file ? req.file.path : logo_url;
    
    const result = await db.query(queries.updateBranding, [orgId, finalLogoUrl || null, brand_color || null]);
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const saveNotification = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { id, name, event_trigger, channel, subject_template, body_template } = req.body;
    let result;
    if (id && !id.startsWith('new_')) {
      result = await db.query(queries.updateNotification, [id, name, event_trigger, channel, subject_template || '', body_template || '', orgId]);
    } else {
      result = await db.query(queries.createNotification, [orgId, name, event_trigger, channel, subject_template || '', body_template || '']);
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const savePermission = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Permissions are system-wide, but we allow creating them dynamically here
    const check = await db.query(queries.checkPermissionExists, [name]);
    let result;
    if (check.rows.length === 0) {
      result = await db.query(queries.createPermission, [name, description || '']);
    } else {
      result = await db.query(queries.updatePermission, [name, description || '']);
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getEmployees = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const employees = await db.query(queries.getEmployees, [orgId]);
    res.status(200).json({ success: true, data: employees.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = { 
  getSetup, getEmployees, saveBranch, saveDepartment, saveCategory, saveEmployee,
  getSaaSSetup, saveRole, saveBranding, saveNotification, savePermission
};
