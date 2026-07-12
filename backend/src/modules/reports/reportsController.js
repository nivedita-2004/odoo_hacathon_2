const db = require('../../config/db');
const queries = require('./reportsQueries');

const getReportData = async (req, res) => {
  try {
    const orgId = req.user.organization_id;

    // 1. Asset Utilization - counts by status
    const assetsByStatus = await db.query(queries.getAssetsByStatus, [orgId]);

    const totalAssets = assetsByStatus.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const allocatedCount = assetsByStatus.rows
      .filter(r => ['Allocated', 'Reserved', 'In Use'].includes(r.name))
      .reduce((sum, r) => sum + parseInt(r.count), 0);
    const utilization = totalAssets > 0 ? Math.round((allocatedCount / totalAssets) * 100) : 0;

    // 2. Department allocation breakdown
    const departmentAllocation = await db.query(queries.getDepartmentAllocation, [orgId]);

    // 3. Maintenance stats
    const maintenanceStats = await db.query(queries.getMaintenanceStats, [orgId]);

    const totalMaintenance = maintenanceStats.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const unresolvedMaintenance = maintenanceStats.rows
      .filter(r => r.status !== 'Resolved')
      .reduce((sum, r) => sum + parseInt(r.count), 0);
    const maintenanceRate = totalMaintenance > 0 ? Math.round((unresolvedMaintenance / totalMaintenance) * 100) : 0;

    // 4. Active bookings count
    const activeBookings = await db.query(queries.getActiveBookings, [orgId]);

    // 5. Active allocations count
    const activeAllocations = await db.query(queries.getActiveAllocations, [orgId]);

    // 6. Maintenance by priority for chart
    const maintenanceByPriority = await db.query(queries.getMaintenanceByPriority, [orgId]);

    // 7. Most used / idle assets (by booking count)
    const assetUsage = await db.query(queries.getAssetUsage, [orgId]);

    // 8. Booking heatmap (hour-of-day by day-of-week)
    const bookingHeatmap = await db.query(queries.getBookingHeatmap, [orgId]);

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
    const utilizationTrend = await db.query(queries.getUtilizationTrend, [orgId]);

    const trendData = utilizationTrend.rows.map(r => ({
      month: r.month,
      utilized: totalAssets > 0 ? Math.round((parseInt(r.allocated) / totalAssets) * 100) : 0,
      available: totalAssets > 0 ? 100 - Math.round((parseInt(r.allocated) / totalAssets) * 100) : 100,
    }));

    // 10. Watchlist - assets needing attention (under maintenance or nearing issues)
    const watchlist = await db.query(queries.getWatchlist, [orgId]);

    // 11. Full asset list for CSV export
    const allAssets = await db.query(queries.getAllAssets, [orgId]);

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
