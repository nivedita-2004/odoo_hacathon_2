const db = require('../../config/db');
const queries = require('./auditQueries');

const getAudits = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getAudits, [orgId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getAuditors = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getEmployeesForAuditor, [orgId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching auditors:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const createAudit = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { name, department_id, scheduled_date, assigned_to } = req.body;

    if (!name || !scheduled_date || !assigned_to) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    await db.query('BEGIN');

    const auditRes = await db.query(queries.createAudit, [
      orgId, name, department_id || null, scheduled_date, assigned_to
    ]);
    const auditId = auditRes.rows[0].id;

    // Add assets to audit scope
    let assets;
    if (department_id) {
      assets = await db.query(queries.getAssetsByDepartment, [orgId, department_id]);
    } else {
      assets = await db.query(queries.getAllOrgAssets, [orgId]);
    }

    for (const asset of assets.rows) {
      await db.query(queries.addAuditAsset, [auditId, asset.id, userId]);
    }

    await db.query(queries.createAuditLog, [
      auditId, `Audit cycle created. ${assets.rows.length} assets in scope.`, userId
    ]);

    await db.query('COMMIT');
    res.status(201).json({ success: true, data: { id: auditId, assets_count: assets.rows.length } });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating audit:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const verifyAsset = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { audit_id } = req.params;
    const { audit_asset_id, status, notes } = req.body;

    await db.query('BEGIN');

    const result = await db.query(queries.updateAuditAssetStatus, [
      status, notes || '', userId, audit_asset_id, audit_id
    ]);

    if (result.rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Audit asset not found' });
    }

    // Move audit to IN_PROGRESS if still SCHEDULED
    await db.query(queries.updateAuditStatus, ['IN_PROGRESS', userId, audit_id, orgId]);

    await db.query(queries.createAuditLog, [
      audit_id, `Asset verified as ${status}${notes ? ': ' + notes : ''}`, userId
    ]);

    await db.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error verifying asset:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const closeAudit = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { audit_id } = req.params;

    // Get all audit assets for this audit
    const auditData = await db.query(queries.getAudits, [orgId]);
    const audit = auditData.rows.find(a => a.id === audit_id);
    if (!audit) {
      return res.status(404).json({ success: false, error: 'Audit not found' });
    }

    const items = audit.items || [];
    const pending = items.filter(i => i.status === 'PENDING').length;
    if (pending > 0) {
      return res.status(400).json({ success: false, error: `${pending} assets still pending verification` });
    }

    const total = items.length;
    const found = items.filter(i => i.status === 'VERIFIED').length;
    const missing = items.filter(i => i.status === 'MISSING').length;
    const damaged = items.filter(i => i.status === 'DAMAGED').length;

    await db.query('BEGIN');

    await db.query(queries.updateAuditStatus, ['COMPLETED', userId, audit_id, orgId]);

    await db.query(queries.createAuditResult, [
      audit_id, total, found, missing, damaged,
      `Audit completed. ${found} verified, ${missing} missing, ${damaged} damaged.`,
      userId
    ]);

    await db.query(queries.createAuditLog, [
      audit_id, `Audit closed. ${found}/${total} verified. ${missing} missing, ${damaged} damaged.`, userId
    ]);

    await db.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error closing audit:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getAudits,
  getAuditors,
  createAudit,
  verifyAsset,
  closeAudit
};
