const express = require('express');
const router = express.Router();
const bookingController = require('./bookingController');
const protect = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Resource routes
router.get('/resources', bookingController.getResources);
router.post('/resources', bookingController.addResource);

// Booking routes
router.get('/', bookingController.getBookings);
router.post('/', bookingController.createBooking);
router.put('/:id', bookingController.updateBooking);
router.put('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
