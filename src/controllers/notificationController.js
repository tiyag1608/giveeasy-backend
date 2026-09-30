const Notification = require('../models/Notification');
const { dispatchNotification } = require('../services/notificationService');

/**
 * @desc    Send a notification (Admin / System / User flow)
 * @route   POST /api/notifications/send
 * @access  Public / Private
 */
const sendNotification = async (req, res, next) => {
  try {
    const { userId, recipientEmail, title, body, type = 'system_alert', dataPayload = {} } = req.body;

    const targetUserId = userId || (req.user ? req.user.id : null);
    const targetEmail = recipientEmail || (req.user ? req.user.email : 'supporter@giveeasy.org');

    const result = await dispatchNotification({
      userId: targetUserId,
      email: targetEmail,
      title,
      body,
      type,
      dataPayload,
    });

    res.status(201).json({
      success: true,
      message: 'Notification dispatched successfully via Firebase & Socket.io',
      data: result.notification,
      provider: result.pushResult.provider,
      fcmMessageId: result.pushResult.messageId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notifications for user (or all if public demo)
 * @route   GET /api/notifications
 * @access  Public / Authenticated
 */
const getNotifications = async (req, res, next) => {
  try {
    let query = {};
    if (req.user) {
      query.$or = [
        { userId: req.user.id },
        { recipientEmail: req.user.email },
      ];
    } else if (req.query.email) {
      query.recipientEmail = req.query.email;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.readStatus = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendNotification,
  getNotifications,
  markAsRead,
};
