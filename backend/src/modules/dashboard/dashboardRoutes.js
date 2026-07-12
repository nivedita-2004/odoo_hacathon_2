const { Router } = require('express');
const { getAdminDashboard } = require('./dashboardController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = Router();

router.get('/admin', authMiddleware, getAdminDashboard);

module.exports = router;
