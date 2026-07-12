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

const getNotifications = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const [allocationsRes, transfersRes, returnsRes, maintenanceRes, bookingsRes, overdueRes, auditsRes, activitiesRes] = await Promise.all([
      db.query(queries.getNotificationsAllocations, [orgId]),
      db.query(queries.getNotificationsTransfers, [orgId]),
      db.query(queries.getNotificationsReturns, [orgId]),
      db.query(queries.getNotificationsMaintenance, [orgId]),
      db.query(queries.getNotificationsBookings, [orgId]),
      db.query(queries.getOverdue, [orgId]),
      db.query(queries.getNotificationsAudits, [orgId]),
      db.query(queries.getActivityLogs, [orgId])
    ]);

    const notifications = [
      ...allocationsRes.rows.map((row) => ({
        id: `allocation-${row.id}`,
        type: 'asset',
        title: 'Asset Assigned',
        message: `${row.asset_name} (${row.asset_tag}) was assigned to ${row.employee_name || row.department || 'the team'}.`,
        time: row.time || new Date().toISOString(),
        module: 'Allocations',
        actor: row.employee_name || 'System',
        department: row.department,
        recipient: row.employee_name || row.department || 'Team',
        priority: 'normal'
      })),
      ...transfersRes.rows.map((row) => ({
        id: `transfer-${row.id}`,
        type: 'transfer',
        title: `Transfer ${row.status}`,
        message: `${row.asset_name} (${row.asset_tag}) transfer from ${row.from_department || 'Unknown'} to ${row.to_department || 'Unknown'} is ${row.status.toLowerCase()}.`,
        time: row.time || new Date().toISOString(),
        module: 'Transfers',
        actor: row.requested_by,
        department: row.to_department || row.from_department,
        recipient: row.requested_by,
        priority: row.status === 'PENDING' ? 'attention' : 'normal'
      })),
      ...returnsRes.rows.map((row) => ({
        id: `return-${row.id}`,
        type: 'asset',
        title: 'Asset Returned',
        message: `${row.asset_name} (${row.asset_tag}) was returned by ${row.returned_by}.`,
        time: row.time || new Date().toISOString(),
        module: 'Returns',
        actor: row.returned_by,
        department: row.department,
        recipient: row.returned_by,
        priority: 'normal'
      })),
      ...maintenanceRes.rows.map((row) => ({
        id: `maintenance-${row.id}`,
        type: 'maintenance',
        title: `Maintenance ${row.status}`,
        message: `${row.issue_description} for ${row.asset_name} (${row.asset_tag}) was submitted by ${row.raised_by}.`,
        time: row.time || new Date().toISOString(),
        module: 'Maintenance',
        actor: row.raised_by,
        department: row.department,
        recipient: row.raised_by,
        priority: ['Rejected', 'Critical'].includes(row.status) || row.priority === 'Critical' ? 'attention' : 'normal'
      })),
      ...bookingsRes.rows.map((row) => ({
        id: `booking-${row.id}`,
        type: 'booking',
        title: `Booking ${row.status}`,
        message: `${row.resource_name} was booked by ${row.booked_by} from ${row.start_time?.toISOString?.() ?? row.start_time} to ${row.end_time?.toISOString?.() ?? row.end_time}.`,
        time: row.start_time || new Date().toISOString(),
        module: 'Bookings',
        actor: row.booked_by,
        department: row.department,
        recipient: row.booked_by,
        priority: row.status === 'CANCELLED' ? 'attention' : 'normal'
      })),
      ...overdueRes.rows.map((row) => ({
        id: `overdue-${row.assetTag}-${row.holder}`,
        type: 'overdue',
        title: 'Overdue Return Alert',
        message: `${row.assetName} (${row.assetTag}) is overdue for ${row.holder}. Expected return was ${row.expectedReturn}.`,
        time: row.expectedReturn || new Date().toISOString(),
        module: 'Allocations',
        actor: 'System',
        department: row.department,
        recipient: row.holder,
        priority: 'critical'
      })),
      ...auditsRes.rows.map((row) => ({
        id: `audit-${row.id}-${row.result}`,
        type: 'audit',
        title: 'Audit Discrepancy Flagged',
        message: `${row.asset_name} (${row.asset_tag}) in ${row.audit_name} was marked ${row.result}.`,
        time: row.time || new Date().toISOString(),
        module: 'Audits',
        actor: row.checked_by,
        department: '',
        recipient: row.checked_by,
        priority: 'critical'
      }))
    ];

    const logs = activitiesRes.rows.map((row, index) => ({
      id: `activity-${index}-${row.created_at}`,
      type: row.module?.toLowerCase() || 'activity',
      action: row.action,
      actor: row.user_name || 'System',
      time: row.created_at,
      module: row.module || 'General',
      detail: ''
    }));

    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    logs.sort((a, b) => new Date(b.time) - new Date(a.time));

    const readsRes = await db.query('SELECT notification_id FROM user_notification_reads WHERE user_id = $1', [userId]);
    const readIds = readsRes.rows.map(r => r.notification_id);

    res.status(200).json({ success: true, data: { notifications, logs, readIds } });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getAdminDashboard,
  getNotifications
};
