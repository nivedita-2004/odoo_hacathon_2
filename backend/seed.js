const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Organization & Core Data
    const orgRes = await client.query(`
      INSERT INTO organizations (name, billing_email, status) 
      VALUES ('AssetFlow Corp', 'billing@assetflow.ai', 'ACTIVE') 
      ON CONFLICT DO NOTHING RETURNING id;
    `);
    
    let orgId;
    if (orgRes.rows.length > 0) {
      orgId = orgRes.rows[0].id;
    } else {
      const existingOrg = await client.query("SELECT id FROM organizations LIMIT 1");
      orgId = existingOrg.rows[0].id;
    }

    console.log('Using Org ID:', orgId);

    // 2. Departments
    const depts = ['IT', 'HR', 'Engineering', 'Marketing', 'Sales'];
    const deptIds = [];
    for (const d of depts) {
      const res = await client.query(
        `INSERT INTO departments (organization_id, name) VALUES ($1, $2) RETURNING id`,
        [orgId, d]
      );
      deptIds.push(res.rows[0].id);
    }

    // 3. Employees
    const empIds = [];
    for (let i = 1; i <= 10; i++) {
      const res = await client.query(
        `INSERT INTO employees (organization_id, department_id, first_name, last_name, email) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [orgId, deptIds[i % depts.length], `Emp${i}`, `Last${i}`, `emp${i}@example.com`]
      );
      empIds.push(res.rows[0].id);
    }

    // 4. Asset Lookups
    const categories = ['Computers', 'Furniture', 'Vehicles'];
    const catIds = [];
    for (const c of categories) {
      const res = await client.query(`INSERT INTO asset_categories (organization_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`, [orgId, c]);
      if(res.rows[0]) catIds.push(res.rows[0].id);
    }
    
    // Fallback if ON CONFLICT DO NOTHING returned 0 rows
    const actualCatIds = await client.query(`SELECT id FROM asset_categories WHERE organization_id = $1 LIMIT 3`, [orgId]);

    const subcategoryName = 'Laptops';
    const subcatRes = await client.query(
      `INSERT INTO asset_subcategories (organization_id, category_id, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id`,
      [orgId, actualCatIds.rows[0].id, subcategoryName]
    );
    let subcatId = subcatRes.rows.length ? subcatRes.rows[0].id : (await client.query(`SELECT id FROM asset_subcategories WHERE name = $1`, [subcategoryName])).rows[0].id;

    // Statuses
    const statuses = ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'];
    const statusIds = {};
    for (const s of statuses) {
      const res = await client.query(`INSERT INTO asset_status (organization_id, name) VALUES ($1, $2) RETURNING id`, [orgId, s]);
      statusIds[s] = res.rows[0].id;
    }

    // Conditions
    const condRes = await client.query(`INSERT INTO asset_condition (organization_id, name, score) VALUES ($1, 'GOOD', 4) RETURNING id`, [orgId]);
    const condId = condRes.rows[0].id;

    // 5. Assets
    const assetIds = [];
    for (let i = 1; i <= 20; i++) {
      let statusName = 'Available';
      if (i <= 8) statusName = 'Allocated';
      else if (i <= 10) statusName = 'Under Maintenance';
      
      const res = await client.query(
        `INSERT INTO assets (organization_id, name, asset_tag, serial_number, subcategory_id, status_id, condition_id, current_department_id, current_employee_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          orgId, 
          `Asset ${i}`, 
          `TAG-00${i}`, 
          `SN123${i}`, 
          subcatId, 
          statusIds[statusName], 
          condId,
          statusName === 'Allocated' ? deptIds[i % depts.length] : null,
          statusName === 'Allocated' ? empIds[i % empIds.length] : null
        ]
      );
      assetIds.push({ id: res.rows[0].id, tag: `TAG-00${i}`, status: statusName });
    }

    // 6. Allocations (Including Overdue)
    for (let i = 0; i < 8; i++) {
      const expectedReturn = i < 3 ? new Date(Date.now() - 86400000 * 5) : new Date(Date.now() + 86400000 * 10); // First 3 are overdue
      await client.query(
        `INSERT INTO asset_allocations (organization_id, asset_id, employee_id, department_id, allocated_date, expected_return_date)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)`,
        [orgId, assetIds[i].id, empIds[i % empIds.length], null, expectedReturn]
      );
    }

    // 7. Transfers
    const userRes = await client.query(`SELECT id FROM users LIMIT 1`);
    if(userRes.rows.length > 0) {
      for (let i = 0; i < 2; i++) {
        await client.query(
          `INSERT INTO asset_transfers (organization_id, asset_id, source_department_id, destination_department_id, requested_by, status, reason)
           VALUES ($1, $2, $3, $4, $5, 'PENDING', 'Project shift')`,
          [orgId, assetIds[0].id, deptIds[0], deptIds[1], userRes.rows[0].id]
        );
      }
    }

    // 8. Maintenance
    const maintUser = userRes.rows.length ? userRes.rows[0].id : null;
    if (maintUser) {
      await client.query(
        `INSERT INTO maintenance_requests (organization_id, asset_id, requested_by, priority, issue_description, status)
         VALUES ($1, $2, $3, 'HIGH', 'Screen broken', 'PENDING')`,
        [orgId, assetIds[8].id, maintUser]
      );
    }

    // 9. Bookings
    const resourceRes = await client.query(
      `INSERT INTO booking_resources (organization_id, asset_id, is_bookable) VALUES ($1, $2, true) RETURNING id`,
      [orgId, assetIds[10].id]
    );
    if(maintUser) {
      await client.query(
        `INSERT INTO bookings (organization_id, resource_id, booked_by, start_time, end_time, status)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '2 hours', 'CONFIRMED')`,
        [orgId, resourceRes.rows[0].id, maintUser]
      );
    }

    // 10. Audits
    if(maintUser) {
      const auditRes = await client.query(
        `INSERT INTO audit_schedules (organization_id, name, scheduled_date, assigned_to, status)
         VALUES ($1, 'Q3 Internal Audit', CURRENT_TIMESTAMP, $2, 'OPEN') RETURNING id`,
        [orgId, maintUser]
      );
      
      await client.query(
        `INSERT INTO audit_assets (audit_id, asset_id, status, notes)
         VALUES ($1, $2, 'MISSING', 'Could not locate')`,
        [auditRes.rows[0].id, assetIds[0].id]
      );
    }

    await client.query('COMMIT');
    console.log('Seeding successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
