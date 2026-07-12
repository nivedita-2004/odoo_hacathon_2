const express = require('express');
const router = express.Router();
const maintenanceController = require('./maintenanceController');
const protect = require('../../middleware/authMiddleware');
const authorizeRoles = require('../../middleware/rbacMiddleware');

router.use(protect);

router.get('/requests', maintenanceController.getRequests);
router.post('/requests', maintenanceController.createRequest); // Employees can create
router.put('/requests/:id/approve', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.approveRequest);
router.put('/requests/:id/reject', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.rejectRequest);
router.put('/requests/:id/assign', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.assignTechnician);
router.put('/requests/:id/start', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.startWork);
router.put('/requests/:id/resolve', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.resolveRequest);

router.get('/engineers', maintenanceController.getEngineers);

module.exports = router;
