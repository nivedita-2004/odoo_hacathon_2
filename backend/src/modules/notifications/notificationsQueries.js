const markNotificationAsRead = `
  INSERT INTO user_notification_reads (user_id, notification_id) 
  VALUES ($1, $2) 
  ON CONFLICT DO NOTHING
`;

module.exports = {
  markNotificationAsRead
};
