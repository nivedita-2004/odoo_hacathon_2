const { Router } = require('express');
const { getAdminDashboard, getNotifications } = require('./dashboardController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = Router();

router.get('/admin', authMiddleware, getAdminDashboard);
router.get('/notifications', authMiddleware, getNotifications);

module.exports = router;
