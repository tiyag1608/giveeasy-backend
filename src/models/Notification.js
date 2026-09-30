const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    recipientEmail: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: [true, 'Please provide notification title'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Please provide notification body message'],
    },
    type: {
      type: String,
      enum: ['donation_receipt', 'campaign_update', 'cause_verification', 'system_alert'],
      default: 'donation_receipt',
    },
    dataPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    fcmMessageId: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      default: 'firebase',
    },
    readStatus: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
