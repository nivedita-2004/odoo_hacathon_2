const { Router } = require('express');
const authController = require('./authController');

const router = Router();

router.post('/register', authController.register);
router.post('/verify-registration-otp', authController.verifyRegistrationOtp);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/google/select-workspace', authController.googleSelectWorkspace);
router.post('/google/create-workspace', authController.googleCreateWorkspace);

module.exports = router;
