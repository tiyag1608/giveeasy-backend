const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for anonymous donations
    },
    donorName: {
      type: String,
      required: [true, 'Please provide donor name'],
      trim: true,
    },
    donorEmail: {
      type: String,
      required: [true, 'Please provide donor email'],
      lowercase: true,
      trim: true,
    },
    donorPhone: {
      type: String,
      trim: true,
      default: '',
    },
    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Please provide campaign ID'],
    },
    causeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cause',
      required: false,
    },
    amount: {
      type: Number,
      required: [true, 'Please specify donation amount'],
      min: [1, 'Donation amount must be at least ₹1'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CreditCard', 'DebitCard', 'NetBanking', 'Wallet', 'SimulatedGateway'],
      default: 'UPI',
    },
    paymentStatus: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      default: 'success',
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      required: true,
    },
    // Advanced feature: Recurring Donations
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['none', 'monthly', 'quarterly', 'yearly'],
      default: 'none',
    },
    recurringStatus: {
      type: String,
      enum: ['none', 'active', 'paused', 'cancelled'],
      default: 'none',
    },
    // Advanced feature: 80G Tax Exemption Receipts
    taxReceipt: {
      eligible: {
        type: Boolean,
        default: true,
      },
      panNumber: {
        type: String,
        uppercase: true,
        trim: true,
        default: '',
      },
      receiptGenerated: {
        type: Boolean,
        default: true,
      },
      exemptionSection: {
        type: String,
        default: 'Section 80G of Income Tax Act 1961',
      },
    },
    fcmPushStatus: {
      sent: { type: Boolean, default: false },
      messageId: { type: String, default: null },
      timestamp: { type: Date, default: null },
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster lookups
donationSchema.index({ donorId: 1, createdAt: -1 });
donationSchema.index({ campaignId: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
