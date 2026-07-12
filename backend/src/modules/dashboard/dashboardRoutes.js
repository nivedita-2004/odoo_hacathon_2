const { Router } = require('express');
const { getAdminDashboard, getNotifications, getExecutiveBriefing } = require('./dashboardController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = Router();

router.get('/admin', authMiddleware, getAdminDashboard);
router.get('/executive-briefing', authMiddleware, getExecutiveBriefing);
router.get('/notifications', authMiddleware, getNotifications);

module.exports = router;
