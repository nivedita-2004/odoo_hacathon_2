const express = require('express');
const router = express.Router();
const auditController = require('./auditController');
const protect = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', auditController.getAudits);
router.get('/auditors', auditController.getAuditors);
router.post('/', auditController.createAudit);
router.put('/:audit_id/verify', auditController.verifyAsset);
router.put('/:audit_id/close', auditController.closeAudit);

module.exports = router;
