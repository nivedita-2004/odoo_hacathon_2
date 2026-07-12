const express = require('express');
const router = express.Router();
const assetController = require('./assetController');
const authMiddleware = require('../../middleware/authMiddleware');
const authorizeRoles = require('../../middleware/rbacMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.get('/metadata', assetController.getMetadata);
router.get('/export', authorizeRoles('ADMIN', 'ASSET_MANAGER'), assetController.exportAssets);
router.post('/import', authorizeRoles('ADMIN', 'ASSET_MANAGER'), upload.single('file'), assetController.importAssets);
router.get('/', assetController.getAssets);
router.post('/', authorizeRoles('ADMIN', 'ASSET_MANAGER'), assetController.createAsset);
router.get('/:id/health', assetController.getAssetHealth);
router.get('/:id/timeline', assetController.getAssetTimeline);
router.get('/:id', assetController.getAssetById);

module.exports = router;
