const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Clearing existing data...');
    
    // Clear data
    await client.query(`
      TRUNCATE TABLE 
        activity_logs, ai_queries, approval_actions, approval_requests, approval_steps, 
        asset_allocations, asset_events, asset_transfers, audit_assets, audit_logs, 
        audit_schedules, bookings, login_history, maintenance_logs, maintenance_requests, 
        notification_preferences, notifications, otp, password_reset, purchase_receipts, 
        recommendation_history, refresh_tokens, sessions, user_roles, vendor_ratings, 
        assets, asset_condition, asset_status, asset_subcategories, asset_categories, 
        booking_resources, users, employees, departments, organizations 
      RESTART IDENTITY CASCADE;
    `);

    console.log('Inserting Organization...');
    // 1. Organization & Core Data
    const orgRes = await client.query(`
      INSERT INTO organizations (name, billing_email, status) 
      VALUES ('Acme Corp', 'admin@acmecorp.com', 'ACTIVE') 
      RETURNING id;
    `);
    const orgId = orgRes.rows[0].id;

    console.log('Inserting Departments...');
    // 2. Departments
    const depts = ['Engineering', 'Design', 'IT Operations', 'Human Resources', 'Sales'];
    const deptIds = {};
    for (const d of depts) {
      const res = await client.query(
        `INSERT INTO departments (organization_id, name) VALUES ($1, $2) RETURNING id`,
        [orgId, d]
      );
      deptIds[d] = res.rows[0].id;
    }

    console.log('Inserting Employees & Admin User...');
    // 3. Employees
    const employeesData = [
      { first: 'Jane', last: 'Doe', email: 'aviinyou07@gmail.com', dept: 'IT Operations', role: 'ADMIN' },
      { first: 'John', last: 'Smith', email: 'john@acmecorp.com', dept: 'Engineering', role: 'EMPLOYEE' },
      { first: 'Emily', last: 'Chen', email: 'emily@acmecorp.com', dept: 'Design', role: 'EMPLOYEE' },
      { first: 'Michael', last: 'Brown', email: 'michael@acmecorp.com', dept: 'Sales', role: 'EMPLOYEE' },
      { first: 'Sarah', last: 'Johnson', email: 'sarah@acmecorp.com', dept: 'Human Resources', role: 'EMPLOYEE' }
    ];

    const empIds = [];
    for (const emp of employeesData) {
      const res = await client.query(
        `INSERT INTO employees (organization_id, department_id, first_name, last_name, email, role) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [orgId, deptIds[emp.dept], emp.first, emp.last, emp.email, emp.role]
      );
      empIds.push(res.rows[0].id);

      // Create a user for the Admin
      if (emp.role === 'ADMIN') {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);
        await client.query(
          `INSERT INTO users (organization_id, employee_id, email, password_hash, status) 
           VALUES ($1, $2, $3, $4, 'ACTIVE')`,
          [orgId, res.rows[0].id, emp.email, passwordHash]
        );
        console.log(`Admin user created: ${emp.email} / password123`);
      }
    }

    console.log('Inserting Categories & Statuses...');
    // 4. Asset Lookups
    const categories = ['Computers', 'Monitors', 'Furniture'];
    const catIds = {};
    for (const c of categories) {
      const res = await client.query(`INSERT INTO asset_categories (organization_id, name) VALUES ($1, $2) RETURNING id`, [orgId, c]);
      catIds[c] = res.rows[0].id;
    }

    const subcats = [
      { cat: 'Computers', name: 'MacBook Pro' },
      { cat: 'Computers', name: 'ThinkPad' },
      { cat: 'Monitors', name: 'Dell UltraSharp' },
      { cat: 'Furniture', name: 'Ergonomic Chairs' }
    ];
    const subcatIds = {};
    for (const s of subcats) {
      const res = await client.query(
        `INSERT INTO asset_subcategories (organization_id, category_id, name) VALUES ($1, $2, $3) RETURNING id`,
        [orgId, catIds[s.cat], s.name]
      );
      subcatIds[s.name] = res.rows[0].id;
    }

    const statuses = ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'];
    const statusIds = {};
    for (const s of statuses) {
      const res = await client.query(`INSERT INTO asset_status (organization_id, name) VALUES ($1, $2) RETURNING id`, [orgId, s]);
      statusIds[s] = res.rows[0].id;
    }

    const condRes = await client.query(`INSERT INTO asset_condition (organization_id, name, score) VALUES ($1, 'GOOD', 4) RETURNING id`, [orgId]);
    const condId = condRes.rows[0].id;

    console.log('Inserting Assets...');
    // 5. Assets
    const assetsData = [
      { name: 'MacBook Pro 16" M3 Max', tag: 'MAC-001', sn: 'C02ZG001MD6R', sub: 'MacBook Pro', status: 'Allocated', emp: 1, dept: 'Engineering' },
      { name: 'MacBook Pro 14" M3 Pro', tag: 'MAC-002', sn: 'C02ZG002MD6R', sub: 'MacBook Pro', status: 'Available', emp: null, dept: null },
      { name: 'MacBook Pro 14" M3 Pro', tag: 'MAC-003', sn: 'C02ZG003MD6R', sub: 'MacBook Pro', status: 'Allocated', emp: 2, dept: 'Design' },
      { name: 'Lenovo ThinkPad X1 Carbon', tag: 'THK-001', sn: 'PF2Q1234', sub: 'ThinkPad', status: 'Allocated', emp: 3, dept: 'Sales' },
      { name: 'Lenovo ThinkPad X1 Carbon', tag: 'THK-002', sn: 'PF2Q1235', sub: 'ThinkPad', status: 'Under Maintenance', emp: null, dept: null },
      { name: 'Dell UltraSharp 27" 4K', tag: 'MON-001', sn: 'CN-0X001', sub: 'Dell UltraSharp', status: 'Allocated', emp: 1, dept: 'Engineering' },
      { name: 'Dell UltraSharp 27" 4K', tag: 'MON-002', sn: 'CN-0X002', sub: 'Dell UltraSharp', status: 'Available', emp: null, dept: null },
      { name: 'Dell UltraSharp 32" 4K', tag: 'MON-003', sn: 'CN-0X003', sub: 'Dell UltraSharp', status: 'Allocated', emp: 2, dept: 'Design' },
      { name: 'Herman Miller Aeron', tag: 'CHR-001', sn: 'HM-A-001', sub: 'Ergonomic Chairs', status: 'Allocated', emp: 1, dept: 'Engineering' },
      { name: 'Herman Miller Aeron', tag: 'CHR-002', sn: 'HM-A-002', sub: 'Ergonomic Chairs', status: 'Available', emp: null, dept: null },
      { name: 'Herman Miller Embody', tag: 'CHR-003', sn: 'HM-E-001', sub: 'Ergonomic Chairs', status: 'Available', emp: null, dept: null },
    ];

    const assetIds = [];
    for (const a of assetsData) {
      const res = await client.query(
        `INSERT INTO assets (organization_id, name, asset_tag, serial_number, subcategory_id, status_id, condition_id, current_department_id, current_employee_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          orgId, 
          a.name, 
          a.tag, 
          a.sn, 
          subcatIds[a.sub], 
          statusIds[a.status], 
          condId,
          a.dept ? deptIds[a.dept] : null,
          a.emp !== null ? empIds[a.emp] : null
        ]
      );
      assetIds.push({ id: res.rows[0].id, tag: a.tag, status: a.status, emp: a.emp !== null ? empIds[a.emp] : null });
    }

    console.log('Inserting Allocations...');
    // 6. Allocations (Including Overdue)
    let index = 0;
    for (const a of assetIds) {
      if (a.status === 'Allocated') {
        const expectedReturn = index === 0 ? new Date(Date.now() - 86400000 * 5) : new Date(Date.now() + 86400000 * 30); // 1 is overdue
        await client.query(
          `INSERT INTO asset_allocations (organization_id, asset_id, employee_id, department_id, allocated_date, expected_return_date)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP - interval '10 days', $5)`,
          [orgId, a.id, a.emp, null, expectedReturn]
        );
        index++;
      }
    }

    console.log('Inserting Maintenance & Audits...');
    // 7. Maintenance
    const adminUserId = (await client.query(`SELECT id FROM users WHERE email = 'aviinyou07@gmail.com'`)).rows[0].id;
    
    // Find the one in maintenance
    const maintAsset = assetIds.find(a => a.status === 'Under Maintenance');
    if (maintAsset) {
      await client.query(
        `INSERT INTO maintenance_requests (organization_id, asset_id, requested_by, priority, issue_description, status)
         VALUES ($1, $2, $3, 'HIGH', 'Battery not holding charge', 'PENDING')`,
        [orgId, maintAsset.id, adminUserId]
      );
    }

    // 8. Audits
    const auditRes = await client.query(
      `INSERT INTO audit_schedules (organization_id, name, scheduled_date, assigned_to, status)
       VALUES ($1, 'Q3 Internal Tech Audit', CURRENT_TIMESTAMP, $2, 'OPEN') RETURNING id`,
      [orgId, adminUserId]
    );
    
    // Add one missing asset to audit
    await client.query(
      `INSERT INTO audit_assets (audit_id, asset_id, status, notes)
       VALUES ($1, $2, 'MISSING', 'Could not locate during floor walk')`,
      [auditRes.rows[0].id, assetIds[0].id] // First macbook
    );

    // 9. Bookings
    const resourceRes = await client.query(
      `INSERT INTO booking_resources (organization_id, asset_id, is_bookable) VALUES ($1, $2, true) RETURNING id`,
      [orgId, assetIds[1].id] // The available macbook
    );
    
    await client.query(
      `INSERT INTO bookings (organization_id, resource_id, booked_by, start_time, end_time, status)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '2 hours', 'CONFIRMED')`,
      [orgId, resourceRes.rows[0].id, adminUserId]
    );

    await client.query('COMMIT');
    console.log('Seeding successful! Dashboard and Assets will now look populated and genuine.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
