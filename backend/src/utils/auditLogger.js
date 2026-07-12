const db = require('../config/db');

/**
 * Helper to log audit actions to the activity_logs table.
 * 
 * @param {Object} params
 * @param {string} params.action - e.g., 'ALLOCATED', 'CREATED', 'DELETED'
 * @param {string} params.entityType - e.g., 'ASSET', 'ALLOCATION', 'MAINTENANCE'
 * @param {string} params.entityId - The UUID of the entity being modified
 * @param {string} params.userId - The UUID of the user performing the action
 * @param {string} params.orgId - The UUID of the organization
 * @param {Object} [params.oldData] - JSON object of previous state
 * @param {Object} [params.newData] - JSON object of new state
 * @param {Object} [client] - Optional db client if inside a transaction
 */
const logAudit = async ({ action, entityType, entityId, userId, orgId, oldData = null, newData = null, client = db }) => {
  try {
    await client.query(
      `INSERT INTO activity_logs 
        (organization_id, user_id, action, entity_type, entity_id, old_data, new_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, userId, action, entityType, entityId, oldData, newData]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // We intentionally don't throw to prevent failing the main transaction if logging fails
  }
};

module.exports = { logAudit };
