const express = require('express');
const router = express.Router();
const {
  sendNotification,
  getNotifications,
  markAsRead,
} = require('../controllers/notificationController');
const { optionalAuth, protect } = require('../middlewares/auth');
const { notificationRules, validate } = require('../middlewares/validator');

/**
 * @route   POST /api/notifications/send
 * @desc    Send push notification (Firebase push + in-app)
 * @access  Public / Authenticated
 */
router.post('/send', optionalAuth, notificationRules, validate, sendNotification);

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for user
 * @access  Public / Authenticated
 */
router.get('/', optionalAuth, getNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', protect, markAsRead);

module.exports = router;
