const db = require('../../config/db');
const queries = require('./maintenanceQueries');

const getRequests = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getRequests, [orgId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getEngineers = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    
    const result = await db.query(queries.getEngineers, [orgId]);
    
    // Seed engineers if none exist to make the demo smooth
    if (result.rows.length === 0) {
      const employees = await db.query(queries.getEmployees, [orgId]);
      if (employees.rows.length > 0) {
        // Just pick the first two employees to be engineers
        for (let i = 0; i < Math.min(2, employees.rows.length); i++) {
          await db.query(queries.createEngineer, [orgId, employees.rows[i].id, userId]);
        }
        // fetch again
        const newEngineers = await db.query(queries.getEngineers, [orgId]);
        return res.status(200).json({ success: true, data: newEngineers.rows });
      }
    }
    
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const createRequest = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { asset_id, issue_description, priority, photo_url } = req.body;

    if (!asset_id || !issue_description) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    await db.query('BEGIN');
    
    const requestRes = await db.query(queries.createRequest, [
      orgId, asset_id, userId, priority || 'Medium', issue_description, photo_url || null
    ]);
    const requestId = requestRes.rows[0].id;
    
    await db.query(queries.createLog, [
      orgId, requestId, null, `Request raised. Priority: ${priority || 'Medium'}`, userId
    ]);
    
    await db.query('COMMIT');
    res.status(201).json({ success: true, data: { id: requestId } });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const updateAssetStatusHelper = async (orgId, assetId, statusName) => {
  const statusRes = await db.query(queries.getAssetStatusId, [statusName, orgId]);
  if (statusRes.rows.length > 0) {
    await db.query(queries.updateAssetStatus, [statusRes.rows[0].id, assetId, orgId]);
  }
};

const approveRequest = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;

    await db.query('BEGIN');
    
    const requestRes = await db.query(queries.updateRequestStatus, ['Approved', userId, id, orgId]);
    if (requestRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    await updateAssetStatusHelper(orgId, requestRes.rows[0].asset_id, 'Under Maintenance');
    
    await db.query(queries.createLog, [
      orgId, id, null, 'Approved by Asset Manager. Asset moved to Under Maintenance.', userId
    ]);
    
    await db.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error approving request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;

    await db.query('BEGIN');
    
    const requestRes = await db.query(queries.updateRequestStatus, ['Rejected', userId, id, orgId]);
    if (requestRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    await db.query(queries.createLog, [
      orgId, id, null, 'Rejected by Asset Manager. Request closed.', userId
    ]);
    
    await db.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error rejecting request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const assignTechnician = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;
    const { engineer_id, engineer_name } = req.body;

    await db.query('BEGIN');
    
    const requestRes = await db.query(queries.updateRequestStatus, ['Technician Assigned', userId, id, orgId]);
    if (requestRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    const assetId = requestRes.rows[0].asset_id;
    
    // Create Task
    const taskRes = await db.query(queries.createTask, [
      orgId, id, assetId, engineer_id, userId
    ]);
    const taskId = taskRes.rows[0].id;
    
    await db.query(queries.createLog, [
      orgId, id, taskId, `Technician assigned: ${engineer_name}`, userId
    ]);
    
    await db.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error assigning technician:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const startWork = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;

    await db.query('BEGIN');
    
    const requestRes = await db.query(queries.updateRequestStatus, ['In Progress', userId, id, orgId]);
    if (requestRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    await db.query(queries.createLog, [
      orgId, id, null, 'Work started on asset.', userId
    ]);
    
    await db.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error starting work:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const resolveRequest = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;
    const { resolution } = req.body;

    await db.query('BEGIN');
    
    const requestRes = await db.query(queries.updateRequestStatus, ['Resolved', userId, id, orgId]);
    if (requestRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    await updateAssetStatusHelper(orgId, requestRes.rows[0].asset_id, 'Available');
    
    await db.query(queries.createLog, [
      orgId, id, null, `Resolved: ${resolution}`, userId
    ]);
    
    await db.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error resolving request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getRequests,
  getEngineers,
  createRequest,
  approveRequest,
  rejectRequest,
  assignTechnician,
  startWork,
  resolveRequest
};
