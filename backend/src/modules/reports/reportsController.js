const db = require('../../config/db');

const getReportData = async (req, res) => {
  try {
    const orgId = req.user.organization_id;

    // 1. Asset Utilization - counts by status
    const assetsByStatus = await db.query(`
      SELECT s.name as status, COUNT(*) as count
      FROM assets a
      JOIN asset_status s ON a.status_id = s.id
      WHERE a.organization_id = $1 AND a.deleted_at IS NULL
      GROUP BY s.name
    `, [orgId]);

    const totalAssets = assetsByStatus.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const allocatedCount = assetsByStatus.rows
      .filter(r => ['Allocated', 'Reserved', 'In Use'].includes(r.name))
      .reduce((sum, r) => sum + parseInt(r.count), 0);
    const utilization = totalAssets > 0 ? Math.round((allocatedCount / totalAssets) * 100) : 0;

    // 2. Department allocation breakdown
    const departmentAllocation = await db.query(`
      SELECT d.name, COUNT(a.id) as value
      FROM assets a
      JOIN departments d ON a.current_department_id = d.id
      WHERE a.organization_id = $1 AND a.deleted_at IS NULL
      GROUP BY d.name
      ORDER BY value DESC
    `, [orgId]);

    // 3. Maintenance stats
    const maintenanceStats = await db.query(`
      SELECT 
        mr.status,
        COUNT(*) as count
      FROM maintenance_requests mr
      WHERE mr.organization_id = $1
      GROUP BY mr.status
    `, [orgId]);

    const totalMaintenance = maintenanceStats.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const unresolvedMaintenance = maintenanceStats.rows
      .filter(r => r.status !== 'Resolved')
      .reduce((sum, r) => sum + parseInt(r.count), 0);
    const maintenanceRate = totalMaintenance > 0 ? Math.round((unresolvedMaintenance / totalMaintenance) * 100) : 0;

    // 4. Active bookings count
    const activeBookings = await db.query(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE organization_id = $1
        AND status != 'Cancelled'
        AND end_time > NOW()
    `, [orgId]);

    // 5. Active allocations count
    const activeAllocations = await db.query(`
      SELECT COUNT(*) as count
      FROM asset_allocations
      WHERE organization_id = $1
        AND actual_return_date IS NULL
    `, [orgId]);

    // 6. Maintenance by priority for chart
    const maintenanceByPriority = await db.query(`
      SELECT 
        mr.priority as category,
        COUNT(*) as requests,
        COUNT(*) FILTER (WHERE mr.status = 'Resolved') as resolved
      FROM maintenance_requests mr
      WHERE mr.organization_id = $1
      GROUP BY mr.priority
      ORDER BY requests DESC
    `, [orgId]);

    // 7. Most used / idle assets (by booking count)
    const assetUsage = await db.query(`
      SELECT 
        ast.name, 
        COUNT(b.id) as uses,
        CASE WHEN COUNT(b.id) > 2 THEN 'Most Used' ELSE 'Idle' END as type
      FROM booking_resources br
      JOIN assets ast ON br.asset_id = ast.id
      LEFT JOIN bookings b ON b.resource_id = br.id AND b.status != 'Cancelled'
      WHERE br.organization_id = $1
      GROUP BY ast.name
      ORDER BY uses DESC
      LIMIT 10
    `, [orgId]);

    // 8. Booking heatmap (hour-of-day by day-of-week)
    const bookingHeatmap = await db.query(`
      SELECT 
        EXTRACT(DOW FROM start_time) as dow,
        EXTRACT(HOUR FROM start_time) as hour,
        COUNT(*) as count
      FROM bookings
      WHERE organization_id = $1 AND status != 'Cancelled'
      GROUP BY dow, hour
      ORDER BY dow, hour
    `, [orgId]);

    // Build heatmap structure
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmapData = {};
    for (const dayName of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      heatmapData[dayName] = Array(10).fill(0); // 8AM to 5PM
    }
    for (const row of bookingHeatmap.rows) {
      const dayName = dayNames[parseInt(row.dow)];
      const hourIdx = parseInt(row.hour) - 8;
      if (heatmapData[dayName] && hourIdx >= 0 && hourIdx < 10) {
        heatmapData[dayName][hourIdx] = Math.min(5, parseInt(row.count));
      }
    }

    // 9. Utilization trend (monthly - last 7 months)
    const utilizationTrend = await db.query(`
      SELECT 
        TO_CHAR(date_trunc('month', al.allocated_date), 'Mon') as month,
        COUNT(DISTINCT al.asset_id) as allocated
      FROM asset_allocations al
      WHERE al.organization_id = $1
        AND al.allocated_date >= NOW() - INTERVAL '7 months'
      GROUP BY date_trunc('month', al.allocated_date)
      ORDER BY date_trunc('month', al.allocated_date)
    `, [orgId]);

    const trendData = utilizationTrend.rows.map(r => ({
      month: r.month,
      utilized: totalAssets > 0 ? Math.round((parseInt(r.allocated) / totalAssets) * 100) : 0,
      available: totalAssets > 0 ? 100 - Math.round((parseInt(r.allocated) / totalAssets) * 100) : 100,
    }));

    // 10. Watchlist - assets needing attention (under maintenance or nearing issues)
    const watchlist = await db.query(`
      SELECT 
        a.asset_tag,
        a.name,
        s.name as status,
        d.name as department
      FROM assets a
      JOIN asset_status s ON a.status_id = s.id
      LEFT JOIN departments d ON a.current_department_id = d.id
      WHERE a.organization_id = $1
        AND a.deleted_at IS NULL
        AND s.name IN ('Under Maintenance', 'Disposed', 'Lost')
      ORDER BY a.updated_at DESC
      LIMIT 10
    `, [orgId]);

    // 11. Full asset list for CSV export
    const allAssets = await db.query(`
      SELECT 
        a.asset_tag, a.name, s.name as status,
        d.name as department
      FROM assets a
      JOIN asset_status s ON a.status_id = s.id
      LEFT JOIN departments d ON a.current_department_id = d.id
      WHERE a.organization_id = $1 AND a.deleted_at IS NULL
      ORDER BY a.asset_tag
    `, [orgId]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          utilization,
          maintenanceRate,
          activeBookings: parseInt(activeBookings.rows[0]?.count || 0),
          activeAllocations: parseInt(activeAllocations.rows[0]?.count || 0),
          totalAssets,
        },
        departmentAllocation: departmentAllocation.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        maintenanceByPriority: maintenanceByPriority.rows.map(r => ({
          category: r.category,
          requests: parseInt(r.requests),
          resolved: parseInt(r.resolved),
        })),
        assetUsage: assetUsage.rows.map(r => ({ name: r.name, uses: parseInt(r.uses), type: r.type })),
        heatmap: heatmapData,
        utilizationTrend: trendData,
        watchlist: watchlist.rows,
        allAssets: allAssets.rows,
        assetsByStatus: assetsByStatus.rows.map(r => ({ name: r.status, value: parseInt(r.count) })),
      }
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = { getReportData };
