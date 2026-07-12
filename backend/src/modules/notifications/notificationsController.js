const db = require('../../config/db');

const getNotifications = async (req, res) => {
  // Now handled in dashboardController for synthetic generation
  res.status(404).json({ success: false, error: 'Endpoint deprecated' });
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // The synthetic notification id
    await db.query(
      'INSERT INTO user_notification_reads (user_id, notification_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, id]
    );
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body; // Array of IDs to mark read
    if (notificationIds && notificationIds.length > 0) {
      // Very basic bulk insert loop for MVP
      for (const id of notificationIds) {
        await db.query(
          'INSERT INTO user_notification_reads (user_id, notification_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, id]
        );
      }
    }
    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
