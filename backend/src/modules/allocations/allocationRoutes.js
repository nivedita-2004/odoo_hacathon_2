const express = require('express');
const router = express.Router();
const allocationController = require('./allocationController');
const protect = require('../../middleware/authMiddleware');
const authorizeRoles = require('../../middleware/rbacMiddleware');

// All routes require authentication
router.use(protect);

// Allocation routes
router.get('/', allocationController.getActiveAllocations);
router.post('/allocate', authorizeRoles('ADMIN', 'ASSET_MANAGER'), allocationController.allocateAsset);
router.post('/return', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'), allocationController.returnAsset);
router.get('/returns', allocationController.getReturns);

// Allocation Requests routes
router.get('/requests', allocationController.getAllocationRequests);
router.post('/requests', allocationController.createAllocationRequest);
router.put('/requests/:id/approve', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), allocationController.approveAllocationRequest);
router.put('/requests/:id/reject', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), allocationController.rejectAllocationRequest);

// Transfer routes
router.get('/transfers', allocationController.getTransfers);
router.post('/transfers/request', allocationController.requestTransfer);
router.put('/transfers/:id/approve', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), allocationController.approveTransfer);
router.put('/transfers/:id/reject', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), allocationController.rejectTransfer);

module.exports = router;
