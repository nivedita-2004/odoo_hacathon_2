const express = require('express');
const router = express.Router();
const controller = require('./notificationsController');
const protect = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', controller.getNotifications);
router.put('/:id/read', controller.markAsRead);
router.put('/read-all', controller.markAllAsRead);

module.exports = router;
