const db = require('../../config/db');
const queries = require('./assetQueries');
const qrcode = require('qrcode');
const { cloudinary } = require('../../utils/cloudinary');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { logAudit } = require('../../utils/auditLogger');

const getMetadata = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getMetadata, [orgId]);
    const data = result.rows[0];
    res.status(200).json({
      success: true,
      data: {
        statuses: data.statuses || [],
        conditions: data.conditions || [],
        branches: data.branches || [],
        departments: data.departments || [],
        employees: data.employees || [],
        categories: data.categories || []
      }
    });
  } catch (error) {
    console.error('Error fetching asset metadata:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getAssets = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getAssets, [orgId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const createAsset = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const orgId = req.user.organization_id;
    const {
      name, asset_tag, serial_number, category_id, subcategory_id,
      status_id, condition_id, purchase_cost, purchase_date,
      current_department_id, current_employee_id
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Asset name is required and must be a string' });
    }
    if (!asset_tag || typeof asset_tag !== 'string' || asset_tag.trim() === '') {
      return res.status(400).json({ success: false, error: 'Asset tag is required and must be a string' });
    }
    if (!status_id || !condition_id) {
      return res.status(400).json({ success: false, error: 'Status and Condition are required' });
    }

    await client.query('BEGIN');

    // Default to the first subcategory if not provided
    let finalSubId = subcategory_id;
    if (!finalSubId && category_id) {
       const subRes = await client.query(queries.getSubcategoryLimitOne, [category_id]);
       if (subRes.rows.length > 0) finalSubId = subRes.rows[0].id;
    }

    if (!finalSubId) throw new Error('Valid Category/Subcategory is required');

    const result = await client.query(queries.createAsset, [
      orgId, name, asset_tag, serial_number || null, finalSubId,
      status_id, condition_id, purchase_cost || null, purchase_date || null,
      current_department_id || null, current_employee_id || null
    ]);

    const assetId = result.rows[0].id;

    // Generate QR Code containing the Asset Tag (or URL if needed)
    const qrData = JSON.stringify({ id: assetId, tag: asset_tag, org: orgId });
    const qrDataUrl = await qrcode.toDataURL(qrData, { width: 400, margin: 2, color: { dark: '#4f3448', light: '#ffffff' } });
    
    // Upload to Cloudinary
    let qrCodeUrl = '';
    if (process.env.CLOUDINARY_API_KEY) {
      const uploadResult = await cloudinary.uploader.upload(qrDataUrl, { folder: 'assetflow/qrcodes' });
        qrCodeUrl = uploadResult.secure_url;
    } else {
      // Fallback if Cloudinary is not configured yet
      qrCodeUrl = qrDataUrl; 
    }

    // Save QR Code URL
    await client.query(queries.saveQRCode, [orgId, assetId, qrData, qrCodeUrl]);

    await logAudit({
      action: 'CREATED',
      entityType: 'ASSET',
      entityId: assetId,
      userId: req.user.id,
      orgId,
      newData: { name, asset_tag, status_id },
      client
    });

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { id: assetId, qrCodeUrl } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating asset:', error);
    if (error.code === '23505') {
       return res.status(400).json({ success: false, error: 'Asset tag already exists' });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const getAssetById = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { id } = req.params;
    const result = await db.query(queries.getAssetById, [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Asset not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching asset details:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const exportAssets = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getAssets, [orgId]);
    
    const csvData = result.rows.map(a => ({
      'Asset Name': a.name,
      'Tag': a.asset_tag,
      'Serial Number': a.serial_number || '',
      'Category': a.category_name || '',
      'Subcategory': a.subcategory_name || '',
      'Status': a.status || '',
      'Condition': a.condition || '',
      'Cost': a.purchase_cost || '',
      'Purchase Date': a.purchase_date ? new Date(a.purchase_date).toISOString().split('T')[0] : '',
      'Department': a.department_name || '',
      'Employee': a.first_name ? `${a.first_name} ${a.last_name}` : ''
    }));

    const csvString = stringify(csvData, { header: true });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
    res.status(200).send(csvString);
  } catch (error) {
    console.error('Error exporting assets:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const importAssets = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const orgId = req.user.organization_id;
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true });

    const metaRes = await client.query(queries.getMetadata, [orgId]);
    const meta = metaRes.rows[0];

    const findId = (arr, name) => arr?.find(i => i.name?.toLowerCase() === name?.toLowerCase())?.id;
    
    await client.query('BEGIN');
    let importedCount = 0;

    for (const record of records) {
      if (!record['Asset Name'] || !record['Tag']) continue;

      const catId = findId(meta.categories, record['Category'] || '');
      let subId = null;
      if (catId) {
         const catObj = meta.categories.find(c => c.id === catId);
         subId = findId(catObj.subcategories, record['Subcategory'] || 'General') || catObj.subcategories?.[0]?.id;
      }
      if (!subId) throw new Error(`Category/Subcategory mapping failed for: ${record['Asset Name']}. Ensure Category exists.`);

      const statusId = findId(meta.statuses, record['Status'] || 'Available');
      const conditionId = findId(meta.conditions, record['Condition'] || 'Good');

      if (!statusId || !conditionId) throw new Error(`Status/Condition mapping failed for: ${record['Asset Name']}`);

      const depId = record['Department'] ? findId(meta.departments, record['Department']) : null;
      const empId = record['Employee'] ? (meta.employees?.find(e => `${e.first_name} ${e.last_name}`.toLowerCase() === record['Employee'].toLowerCase())?.id) : null;

      const result = await client.query(queries.createAsset, [
        orgId, record['Asset Name'], record['Tag'], record['Serial Number'] || null, subId,
        statusId, conditionId, record['Cost'] || null, record['Purchase Date'] || null,
        depId, empId
      ]);

      const assetId = result.rows[0].id;
      
      const qrData = JSON.stringify({ id: assetId, tag: record['Tag'], org: orgId });
      const qrDataUrl = await qrcode.toDataURL(qrData, { width: 400, margin: 2, color: { dark: '#4f3448', light: '#ffffff' } });
      
      let qrCodeUrl = '';
      if (process.env.CLOUDINARY_API_KEY) {
        const uploadResult = await cloudinary.uploader.upload(qrDataUrl, { folder: 'assetflow/qrcodes' });
        qrCodeUrl = uploadResult.secure_url;
      } else {
        qrCodeUrl = qrDataUrl;
      }
      await client.query(queries.saveQRCode, [orgId, assetId, qrData, qrCodeUrl]);
      importedCount++;
    }

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: `Successfully imported ${importedCount} assets` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing assets:', error);
    res.status(400).json({ success: false, error: error.message || 'Error processing CSV file' });
  } finally {
    client.release();
  }
};

module.exports = {
  getMetadata,
  getAssets,
  createAsset,
  getAssetById,
  exportAssets,
  importAssets
};
