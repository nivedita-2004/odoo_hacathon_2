require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'assetflow',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function seedData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log("Seeding Demo Data...");

    // 1. Get Organization
    const orgRes = await client.query("SELECT id FROM organizations LIMIT 1");
    if (orgRes.rows.length === 0) {
      console.log("No Organization found. Please register an admin user first.");
      return;
    }
    const orgId = orgRes.rows[0].id;

    // 2. Get Employee & Department
    const empRes = await client.query("SELECT id FROM employees WHERE organization_id = $1 LIMIT 1", [orgId]);
    const deptRes = await client.query("SELECT id FROM departments WHERE organization_id = $1 LIMIT 1", [orgId]);
    const empId = empRes.rows[0]?.id;
    const deptId = deptRes.rows[0]?.id;

    // 3. Get Subcategories, Status, Condition
    const catRes = await client.query("SELECT id FROM asset_categories LIMIT 1");
    let catId = catRes.rows[0]?.id;
    if (!catId) {
       const newCat = await client.query("INSERT INTO asset_categories (organization_id, name) VALUES ($1, 'Electronics') RETURNING id", [orgId]);
       catId = newCat.rows[0].id;
    }

    let subCatRes = await client.query("SELECT id FROM asset_subcategories LIMIT 1");
    let subCatId = subCatRes.rows[0]?.id;
    if (!subCatId) {
       const newSub = await client.query("INSERT INTO asset_subcategories (category_id, name) VALUES ($1, 'Laptops') RETURNING id", [catId]);
       subCatId = newSub.rows[0].id;
    }

    let availRes = await client.query("SELECT id FROM asset_status WHERE name = 'Available' LIMIT 1");
    if (availRes.rows.length === 0) {
      await client.query("INSERT INTO asset_status (organization_id, name) VALUES ($1, 'Available'), ($1, 'Allocated'), ($1, 'Reserved'), ($1, 'Under Maintenance'), ($1, 'Retired'), ($1, 'Lost'), ($1, 'Disposed')", [orgId]);
      availRes = await client.query("SELECT id FROM asset_status WHERE name = 'Available' LIMIT 1");
    }
    const allocatedRes = await client.query("SELECT id FROM asset_status WHERE name = 'Allocated' LIMIT 1");
    const maintRes = await client.query("SELECT id FROM asset_status WHERE name = 'Under Maintenance' LIMIT 1");

    let goodRes = await client.query("SELECT id FROM asset_condition WHERE name = 'Good' LIMIT 1");
    if (goodRes.rows.length === 0) {
      await client.query("INSERT INTO asset_condition (organization_id, name) VALUES ($1, 'Excellent'), ($1, 'Good'), ($1, 'Fair'), ($1, 'Poor'), ($1, 'Damaged')", [orgId]);
      goodRes = await client.query("SELECT id FROM asset_condition WHERE name = 'Good' LIMIT 1");
    }
    const fairRes = await client.query("SELECT id FROM asset_condition WHERE name = 'Fair' LIMIT 1");
    const damagedRes = await client.query("SELECT id FROM asset_condition WHERE name = 'Damaged' LIMIT 1");

    // 4. Create Assets
    const demoAssets = [
      { name: 'MacBook Pro M3 Max', tag: 'IT-MBP-001', status: availRes.rows[0].id, condition: goodRes.rows[0].id, cost: 3500 },
      { name: 'MacBook Pro M3 Max', tag: 'IT-MBP-002', status: allocatedRes.rows[0].id, condition: fairRes.rows[0].id, cost: 3500 },
      { name: 'Dell XPS 15', tag: 'IT-DELL-001', status: availRes.rows[0].id, condition: goodRes.rows[0].id, cost: 2100 },
      { name: 'Herman Miller Aeron', tag: 'FURN-001', status: maintRes.rows[0].id, condition: damagedRes.rows[0].id, cost: 1200 },
      { name: 'Sony A7IV Camera', tag: 'MEDIA-001', status: allocatedRes.rows[0].id, condition: goodRes.rows[0].id, cost: 2500 }
    ];

    const assetIds = [];
    for (const a of demoAssets) {
      const check = await client.query("SELECT id FROM assets WHERE asset_tag = $1 AND organization_id = $2", [a.tag, orgId]);
      if (check.rows.length === 0) {
        const res = await client.query(
          `INSERT INTO assets (organization_id, name, asset_tag, subcategory_id, status_id, condition_id, purchase_cost, purchase_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE - INTERVAL '6 months') RETURNING id`,
          [orgId, a.name, a.tag, subCatId, a.status, a.condition, a.cost]
        );
        assetIds.push({ id: res.rows[0].id, tag: a.tag });
      } else {
        assetIds.push({ id: check.rows[0].id, tag: a.tag });
      }
    }

    // 5. Create Allocations (including an overdue one)
    if (empId) {
      // Overdue Allocation
      const mbp2Id = assetIds.find(a => a.tag === 'IT-MBP-002')?.id;
      if (mbp2Id) {
        await client.query(
          `INSERT INTO asset_allocations (organization_id, asset_id, employee_id, expected_return_date, allocated_date)
           VALUES ($1, $2, $3, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '20 days')
           ON CONFLICT DO NOTHING`,
          [orgId, mbp2Id, empId]
        );
      }

      // Active Allocation
      const media1Id = assetIds.find(a => a.tag === 'MEDIA-001')?.id;
      if (media1Id) {
        await client.query(
          `INSERT INTO asset_allocations (organization_id, asset_id, employee_id, expected_return_date, allocated_date)
           VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE - INTERVAL '2 days')
           ON CONFLICT DO NOTHING`,
          [orgId, media1Id, empId]
        );
      }
    }

    // 6. Create Maintenance Request
    const userRes = await client.query("SELECT id FROM users WHERE organization_id = $1 LIMIT 1", [orgId]);
    const userId = userRes.rows[0]?.id;
    const furnId = assetIds.find(a => a.tag === 'FURN-001')?.id;
    if (furnId && userId) {
      await client.query(
        `INSERT INTO maintenance_requests (organization_id, asset_id, priority, issue_description, status, requested_by)
         VALUES ($1, $2, 'Critical', 'Hydraulic cylinder failed, chair sinks automatically.', 'PENDING', $3)`,
        [orgId, furnId, userId]
      );
    }

    // 7. Seed Health Scores
    for (const a of assetIds) {
      const score = Math.floor(Math.random() * 40) + 60; // 60-100
      await client.query(
        `INSERT INTO asset_health_scores (organization_id, asset_id, health_score, factors)
         VALUES ($1, $2, $3, '[]'::jsonb)
         ON CONFLICT DO NOTHING`,
        [orgId, a.id, score]
      );
    }

    await client.query('COMMIT');
    console.log("Demo Data Seeded Successfully! The UI will now look phenomenal.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Seeding failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

seedData();
