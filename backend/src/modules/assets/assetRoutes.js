const express = require('express');
const router = express.Router();
const assetController = require('./assetController');
const authMiddleware = require('../../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.get('/metadata', assetController.getMetadata);
router.get('/export', assetController.exportAssets);
router.post('/import', upload.single('file'), assetController.importAssets);
router.get('/', assetController.getAssets);
router.post('/', assetController.createAsset);
router.get('/:id', assetController.getAssetById);

module.exports = router;
