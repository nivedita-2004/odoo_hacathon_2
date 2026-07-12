const express = require('express');
const router = express.Router();
const reportsController = require('./reportsController');
const protect = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', reportsController.getReportData);

module.exports = router;
