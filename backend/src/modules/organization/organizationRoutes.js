const express = require('express');
const router = express.Router();
const controller = require('./organizationController');
const authMiddleware = require('../../middleware/authMiddleware');
const { upload } = require('../../utils/cloudinary');

router.use(authMiddleware); // Protect all org routes

router.get('/setup', controller.getSetup);
router.post('/branches', controller.saveBranch);
router.post('/departments', controller.saveDepartment);
router.post('/categories', controller.saveCategory);
router.post('/employees', controller.saveEmployee);

router.get('/saas-setup', controller.getSaaSSetup);
router.post('/roles', controller.saveRole);
router.post('/permissions', controller.savePermission);
router.post('/branding', upload.single('logo'), controller.saveBranding);
router.post('/notifications', controller.saveNotification);

module.exports = router;
