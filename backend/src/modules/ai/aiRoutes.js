const express = require('express');
const router = express.Router();
const { askCopilot } = require('./aiController');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/ask', askCopilot);

module.exports = router;
