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

// Allocation Requests routes
router.get('/requests', allocationController.getAllocationRequests);
router.post('/requests', allocationController.createAllocationRequest);
router.put('/requests/:id/approve', allocationController.approveAllocationRequest);
router.put('/requests/:id/reject', allocationController.rejectAllocationRequest);

// Transfer routes
router.get('/transfers', allocationController.getTransfers);
router.post('/transfers/request', allocationController.requestTransfer);
router.put('/transfers/:id/approve', allocationController.approveTransfer);
router.put('/transfers/:id/reject', allocationController.rejectTransfer);

module.exports = router;
