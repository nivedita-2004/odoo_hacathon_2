const express = require('express');
const router = express.Router();
const controller = require('./organizationController');
const authMiddleware = require('../../middleware/authMiddleware');
const authorizeRoles = require('../../middleware/rbacMiddleware');
const { upload } = require('../../utils/cloudinary');

router.use(authMiddleware); // Protect all org routes

router.get('/setup', controller.getSetup); // Anyone can read setup
router.post('/branches', authorizeRoles('ADMIN'), controller.saveBranch);
router.post('/departments', authorizeRoles('ADMIN'), controller.saveDepartment);
router.post('/categories', authorizeRoles('ADMIN'), controller.saveCategory);
router.get('/employees', controller.getEmployees); // Anyone can view employees (needed for dropdowns)
router.post('/employees', authorizeRoles('ADMIN'), controller.saveEmployee);

router.get('/saas-setup', authorizeRoles('ADMIN'), controller.getSaaSSetup);
router.post('/roles', authorizeRoles('ADMIN'), controller.saveRole);
router.post('/permissions', authorizeRoles('ADMIN'), controller.savePermission);
router.post('/branding', authorizeRoles('ADMIN'), upload.single('logo'), controller.saveBranding);
router.post('/notifications', authorizeRoles('ADMIN'), controller.saveNotification);

module.exports = router;
