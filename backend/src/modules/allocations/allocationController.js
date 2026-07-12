const db = require('../../config/db');
const queries = require('./allocationQueries');
const { logAudit } = require('../../utils/auditLogger');

const getActiveAllocations = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getActiveAllocations, [orgId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const allocateAsset = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { asset_id, employee_id, department_id, expected_return_date } = req.body;

    if (!asset_id) return res.status(400).json({ success: false, error: 'Asset ID is required' });
    if (!employee_id && !department_id) return res.status(400).json({ success: false, error: 'Must allocate to an employee or department' });

    await client.query('BEGIN');

    const targetEmployeeId = employee_id ? employee_id : null;
    const targetDepartmentId = employee_id ? null : (department_id ? department_id : null);

    // Create allocation record
    await client.query(queries.createAllocation, [
      orgId, asset_id, targetEmployeeId, targetDepartmentId, userId, new Date(), expected_return_date || null
    ]);

    // Update asset status
    await client.query(queries.updateAssetStatus, [
      'Allocated', targetEmployeeId, targetDepartmentId, asset_id, orgId
    ]);

    await logAudit({
      action: 'ALLOCATED',
      entityType: 'ALLOCATION',
      entityId: asset_id,
      userId,
      orgId,
      newData: { employee_id: targetEmployeeId, department_id: targetDepartmentId },
      client
    });

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Asset allocated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error allocating asset:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const returnAsset = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { allocation_id, notes, condition } = req.body; // condition could be used to log to a different table, for now just notes

    if (!allocation_id) return res.status(400).json({ success: false, error: 'Allocation ID is required' });

    await client.query('BEGIN');

    // Mark allocation as returned
    const returnResult = await client.query(queries.returnAllocation, [
      new Date(), userId, notes || `Condition: ${condition || 'Good'}`, allocation_id, orgId
    ]);

    if (returnResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    const assetId = returnResult.rows[0].asset_id;

    // Update asset status to Available
    await client.query(queries.updateAssetStatus, [
      'Available', null, null, assetId, orgId
    ]);

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Asset returned successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error returning asset:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const getTransfers = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getTransfers, [orgId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const requestTransfer = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { asset_id, destination_department_id, reason } = req.body;

    if (!asset_id || !destination_department_id || !reason) {
      return res.status(400).json({ success: false, error: 'Asset, destination department, and reason are required' });
    }

    // Get current allocation to find source department
    const activeAlloc = await db.query(queries.getActiveAllocationByAsset, [asset_id]);
    if (activeAlloc.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Asset is not currently allocated' });
    }
    const sourceDept = activeAlloc.rows[0].department_id;

    await db.query(queries.createTransfer, [
      orgId, asset_id, sourceDept, destination_department_id, userId, reason
    ]);

    res.status(201).json({ success: true, message: 'Transfer requested successfully' });
  } catch (error) {
    console.error('Error requesting transfer:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const approveTransfer = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;

    await client.query('BEGIN');

    // Update transfer status
    const transferRes = await client.query(queries.updateTransferStatus, [
      'APPROVED', userId, new Date(), id, orgId
    ]);

    if (transferRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Transfer request not found' });
    }

    const { asset_id, destination_department_id } = transferRes.rows[0];

    // Find the active allocation and close it
    const activeAllocRes = await client.query(queries.getActiveAllocationByAsset, [asset_id]);
    if (activeAllocRes.rows.length > 0) {
      const allocId = activeAllocRes.rows[0].id;
      await client.query(queries.returnAllocation, [
        new Date(), userId, 'Closed due to transfer approval', allocId, orgId
      ]);
    }

    // Transfers are primarily to departments. If we need employee transfer, we'd need destination_employee_id.
    // For now, it transfers to the destination department.
    const targetDepartmentId = destination_department_id || null;

    // Create a new allocation for the destination department
    await client.query(queries.createAllocation, [
      orgId, asset_id, null, targetDepartmentId, userId, new Date(), null
    ]);

    // Update asset
    await client.query(queries.updateAssetStatus, [
      'Allocated', null, targetDepartmentId, asset_id, orgId
    ]);

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Transfer approved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving transfer:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const rejectTransfer = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;

    const transferRes = await db.query(queries.updateTransferStatus, [
      'REJECTED', userId, new Date(), id, orgId
    ]);

    if (transferRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Transfer request not found' });
    }

    res.status(200).json({ success: true, message: 'Transfer request rejected' });
  } catch (error) {
    console.error('Error rejecting transfer:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getAllocationRequests = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getAllocationRequests, [orgId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching allocation requests:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const createAllocationRequest = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const employeeId = req.user.employee_id; 
    const { department_id, category_name, preferred_asset_id, reason } = req.body;

    if (!department_id || !category_name || !reason) {
      return res.status(400).json({ success: false, error: 'Department, category, and reason are required' });
    }

    await db.query(queries.createAllocationRequest, [
      orgId, employeeId, department_id, category_name, preferred_asset_id || null, reason
    ]);

    res.status(201).json({ success: true, message: 'Allocation requested successfully' });
  } catch (error) {
    console.error('Error creating allocation request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const approveAllocationRequest = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;
    const { allocated_asset_id } = req.body;

    if (!allocated_asset_id) {
       return res.status(400).json({ success: false, error: 'Allocated asset ID is required' });
    }

    await client.query('BEGIN');

    const reqRes = await client.query(queries.updateAllocationRequestStatus, [
      'APPROVED', userId, allocated_asset_id, id, orgId
    ]);

    if (reqRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Allocation request not found' });
    }

    const { employee_id, department_id } = reqRes.rows[0];

    const targetEmployeeId = employee_id ? employee_id : null;
    const targetDepartmentId = employee_id ? null : department_id;

    await client.query(queries.createAllocation, [
      orgId, allocated_asset_id, targetEmployeeId, targetDepartmentId, userId, new Date(), null
    ]);

    await client.query(queries.updateAssetStatus, [
      'Allocated', targetEmployeeId, targetDepartmentId, allocated_asset_id, orgId
    ]);

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Allocation request approved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving allocation request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const rejectAllocationRequest = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;

    const reqRes = await db.query(queries.updateAllocationRequestStatus, [
      'REJECTED', userId, null, id, orgId
    ]);

    if (reqRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Allocation request not found' });
    }

    res.status(200).json({ success: true, message: 'Allocation request rejected' });
  } catch (error) {
    console.error('Error rejecting allocation request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getReturns = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getReturnsHistory, [orgId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getActiveAllocations,
  allocateAsset,
  returnAsset,
  getTransfers,
  requestTransfer,
  approveTransfer,
  rejectTransfer,
  getReturns,
  getAllocationRequests,
  createAllocationRequest,
  approveAllocationRequest,
  rejectAllocationRequest
};
