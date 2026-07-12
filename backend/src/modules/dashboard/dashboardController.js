const db = require('../../config/db');
const queries = require('./dashboardQueries');

const getAdminDashboard = async (req, res) => {
  try {
    if (!req.user || !req.user.organization_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No organization provided' });
    }
    const orgId = req.user.organization_id;

    const [
      assetsRes,
      allocationsRes,
      transfersRes,
      bookingsRes,
      maintenanceRes,
      auditsRes,
      overdueRes,
      employeesRes,
      activitiesRes
    ] = await Promise.all([
      db.query(queries.getAssets, [orgId]),
      db.query(queries.getAllocations, [orgId]),
      db.query(queries.getTransfers, [orgId]),
      db.query(queries.getBookings, [orgId]),
      db.query(queries.getMaintenance, [orgId]),
      db.query(queries.getAudits, [orgId]),
      db.query(queries.getOverdue, [orgId]),
      db.query(queries.getEmployees, [orgId]),
      db.query(queries.getActivityLogs, [orgId])
    ]);

    const dashboardData = {
      assets: assetsRes.rows,
      allocations: allocationsRes.rows,
      transfers: transfersRes.rows,
      bookingsData: bookingsRes.rows,
      maintenanceRequests: maintenanceRes.rows,
      auditCycles: auditsRes.rows,
      overdueData: overdueRes.rows,
      employeesData: employeesRes.rows,
      activities: activitiesRes.rows
    };

    res.status(200).json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getAdminDashboard
};
