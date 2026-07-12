const express = require('express');
const router = express.Router();
const allocationController = require('./allocationController');
const protect = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Allocation routes
router.get('/', allocationController.getActiveAllocations);
router.post('/allocate', allocationController.allocateAsset);
router.post('/return', allocationController.returnAsset);
router.get('/returns', allocationController.getReturns);

// Transfer routes
router.get('/transfers', allocationController.getTransfers);
router.post('/transfers/request', allocationController.requestTransfer);
router.post('/transfers/:id/approve', allocationController.approveTransfer);

module.exports = router;
