const express = require('express');
const router = express.Router();
const maintenanceController = require('./maintenanceController');
const protect = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/requests', maintenanceController.getRequests);
router.post('/requests', maintenanceController.createRequest);
router.put('/requests/:id/approve', maintenanceController.approveRequest);
router.put('/requests/:id/reject', maintenanceController.rejectRequest);
router.put('/requests/:id/assign', maintenanceController.assignTechnician);
router.put('/requests/:id/start', maintenanceController.startWork);
router.put('/requests/:id/resolve', maintenanceController.resolveRequest);

router.get('/engineers', maintenanceController.getEngineers);

module.exports = router;
