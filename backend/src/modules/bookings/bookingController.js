const db = require('../../config/db');
const queries = require('./bookingQueries');
const { logAudit } = require('../../utils/auditLogger');

const getResources = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(queries.getBookableResources, [orgId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const addResource = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { asset_id, max_duration_hours, requires_approval } = req.body;

    if (!asset_id) return res.status(400).json({ success: false, error: 'Asset ID is required' });

    // Ensure asset belongs to org
    const assetCheck = await db.query(queries.checkAssetExists, [asset_id, orgId]);
    if (assetCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }

    // Ensure it's not already a resource
    const existCheck = await db.query(queries.checkResourceExists, [asset_id]);
    if (existCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Asset is already a bookable resource' });
    }

    await db.query(queries.addResource, [
      orgId, asset_id, max_duration_hours || null, requires_approval || false, userId
    ]);

    await logAudit({
      action: 'CREATED',
      entityType: 'BOOKING_RESOURCE',
      entityId: asset_id,
      userId,
      orgId,
      newData: { max_duration_hours, requires_approval }
    });

    res.status(201).json({ success: true, message: 'Resource added successfully' });
  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getBookings = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    // By default get bookings for a wide range (e.g. 1 year back to 1 year forward) for MVP
    const startDate = req.query.start || new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();
    const endDate = req.query.end || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
    
    const result = await db.query(queries.getBookings, [orgId, startDate, endDate]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const createBooking = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { resource_id, title, start_time, end_time, reminder_minutes } = req.body;

    if (!resource_id || !title || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ success: false, error: 'End time must be after start time' });
    }

    // Check overlap
    const overlap = await db.query(queries.checkOverlap, [
      resource_id, start_time, end_time, null
    ]);

    if (overlap.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Resource is already booked during this time' });
    }

    const result = await db.query(queries.createBooking, [
      orgId, resource_id, title, userId, start_time, end_time, reminder_minutes || 0
    ]);

    await logAudit({
      action: 'CREATED',
      entityType: 'BOOKING',
      entityId: result.rows[0].id,
      userId,
      orgId,
      newData: { resource_id, title, start_time, end_time }
    });

    res.status(201).json({ success: true, data: { id: result.rows[0].id } });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const updateBooking = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;
    const { title, start_time, end_time, reminder_minutes, resource_id } = req.body;

    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ success: false, error: 'End time must be after start time' });
    }

    // Check overlap (excluding this booking ID)
    const overlap = await db.query(queries.checkOverlap, [
      resource_id, start_time, end_time, id
    ]);

    if (overlap.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Resource is already booked during this time' });
    }

    const result = await db.query(queries.updateBooking, [
      title, start_time, end_time, reminder_minutes || 0, userId, id, orgId
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    await logAudit({
      action: 'UPDATED',
      entityType: 'BOOKING',
      entityId: id,
      userId,
      orgId,
      newData: { title, start_time, end_time, reminder_minutes }
    });

    res.status(200).json({ success: true, message: 'Booking updated' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(queries.cancelBooking, [
      userId, id, orgId
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    await logAudit({
      action: 'CANCELLED',
      entityType: 'BOOKING',
      entityId: id,
      userId,
      orgId
    });

    res.status(200).json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getResources,
  addResource,
  getBookings,
  createBooking,
  updateBooking,
  cancelBooking
};
