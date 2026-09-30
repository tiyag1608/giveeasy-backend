const Notification = require('../models/Notification');
const { sendPushNotification } = require('../config/firebase');
const { emitLiveNotification } = require('../sockets/socketHandler');

/**
 * Send and persist donation receipt notification
 */
const sendDonationReceiptNotification = async ({ user, donation, campaign }) => {
  const title = `🎉 Donation Successful - ₹${donation.amount}`;
  const body = `Thank you ${donation.donorName}! Your gift to "${campaign.title}" has been received. Receipt #${donation.receiptNumber}`;

  const dataPayload = {
    donationId: donation._id.toString(),
    receiptNumber: donation.receiptNumber,
    amount: donation.amount.toString(),
    campaignTitle: campaign.title,
    transactionId: donation.transactionId,
  };

  // 1. Send push notification via Firebase (or fallback mock)
  const pushResult = await sendPushNotification({
    token: user?.fcmToken || null,
    title,
    body,
    data: dataPayload,
  });

  // 2. Persist in database
  const notification = await Notification.create({
    userId: user?._id || null,
    recipientEmail: donation.donorEmail,
    title,
    body,
    type: 'donation_receipt',
    dataPayload,
    fcmMessageId: pushResult.messageId,
    provider: pushResult.provider,
  });

  // 3. Emit real-time WebSocket event
  emitLiveNotification(user?._id?.toString(), notification);

  return { notification, pushResult };
};

/**
 * Dispatch general notification
 */
const dispatchNotification = async ({ userId, email, title, body, type, dataPayload = {} }) => {
  const pushResult = await sendPushNotification({
    token: null,
    title,
    body,
    data: dataPayload,
  });

  const notification = await Notification.create({
    userId: userId || null,
    recipientEmail: email,
    title,
    body,
    type: type || 'system_alert',
    dataPayload,
    fcmMessageId: pushResult.messageId,
    provider: pushResult.provider,
  });

  emitLiveNotification(userId, notification);
  return { notification, pushResult };
};

module.exports = {
  sendDonationReceiptNotification,
  dispatchNotification,
};
