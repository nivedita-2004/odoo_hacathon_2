require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'assetflow',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find the Default Organization
    const orgRes = await client.query("SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1");
    if (orgRes.rows.length === 0) {
      console.log("No Default Organization found! Run user registration once first.");
      return;
    }
    const orgId = orgRes.rows[0].id;

    // Branches
    const branches = [
      { name: 'Headquarters', city: 'San Francisco', address: '123 Market St' },
      { name: 'East Coast Hub', city: 'New York', address: '456 Wall St' }
    ];
    const branchIds = {};
    for (const b of branches) {
      const res = await client.query("INSERT INTO branches (organization_id, name, city, address) VALUES ($1, $2, $3, $4) RETURNING id", [orgId, b.name, b.city, b.address]);
      branchIds[b.name] = res.rows[0].id;
    }

    // Departments
    const depts = [
      { name: 'Information Technology', branch: 'Headquarters' },
      { name: 'Human Resources', branch: 'Headquarters' },
      { name: 'Finance', branch: 'East Coast Hub' },
      { name: 'Operations', branch: 'East Coast Hub' }
    ];
    const deptIds = {};
    for (const d of depts) {
      const res = await client.query("INSERT INTO departments (organization_id, name, branch_id) VALUES ($1, $2, $3) RETURNING id", [orgId, d.name, branchIds[d.branch]]);
      deptIds[d.name] = res.rows[0].id;
    }

    // Employees
    const emps = [
      { first: 'Priya', last: 'Sharma', email: 'priya@example.com', dept: 'Information Technology', role: 'EMPLOYEE' },
      { first: 'Rahul', last: 'Verma', email: 'rahul@example.com', dept: 'Information Technology', role: 'DEPARTMENT_HEAD' },
      { first: 'Amit', last: 'Patel', email: 'amit@example.com', dept: 'Operations', role: 'ASSET_MANAGER' },
      { first: 'Neha', last: 'Kapoor', email: 'neha@example.com', dept: 'Finance', role: 'EMPLOYEE' }
    ];
    
    // Check if employee email exists first to avoid duplicate unique constraint
    for (const e of emps) {
      const check = await client.query("SELECT id FROM employees WHERE email = $1 AND organization_id = $2", [e.email, orgId]);
      let empId;
      if (check.rows.length === 0) {
        const res = await client.query("INSERT INTO employees (organization_id, first_name, last_name, email, department_id, role, status) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE') RETURNING id", [orgId, e.first, e.last, e.email, deptIds[e.dept], e.role]);
        empId = res.rows[0].id;
      } else {
        empId = check.rows[0].id;
        await client.query("UPDATE employees SET department_id = $1, role = $2 WHERE id = $3", [deptIds[e.dept], e.role, empId]);
      }

      // If they are a department head, update department
      if (e.role === 'DEPARTMENT_HEAD') {
        await client.query("UPDATE departments SET head_employee_id = $1 WHERE id = $2", [empId, deptIds[e.dept]]);
      }
    }

    // Asset Categories
    const cats = [
      { name: 'Electronics', desc: 'Warranty period, Serial number' },
      { name: 'Furniture', desc: 'Material, Dimensions' },
      { name: 'Vehicles', desc: 'Registration number, Insurance expiry' },
      { name: 'Office Equipment', desc: 'Model, Service interval' }
    ];
    for (const c of cats) {
      // Avoid duplicate unique constraint
      const check = await client.query("SELECT id FROM asset_categories WHERE name = $1 AND organization_id = $2", [c.name, orgId]);
      if (check.rows.length === 0) {
         await client.query("INSERT INTO asset_categories (organization_id, name, description) VALUES ($1, $2, $3)", [orgId, c.name, c.desc]);
      }
    }

    await client.query('COMMIT');
    console.log("Successfully seeded Branches, Departments, Employees, and Asset Categories!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
