const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide campaign title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide campaign description'],
    },
    causeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cause',
      required: [true, 'Please link this campaign to a Cause'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Please provide a target fundraising amount'],
      min: [100, 'Target amount must be at least ₹100'],
    },
    raisedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Raised amount cannot be negative'],
    },
    donorCount: {
      type: Number,
      default: 0,
      min: [0, 'Donor count cannot be negative'],
    },
    category: {
      type: String,
      enum: ['Education', 'Healthcare', 'Disaster Relief', 'Animal Welfare', 'Environment', 'Child Welfare', 'Poverty Alleviation', 'Other'],
      default: 'Healthcare',
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=800&q=80',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    impactMetric: {
      metricName: {
        type: String,
        default: 'People Supported',
      },
      targetCount: {
        type: Number,
        default: 500,
      },
      currentCount: {
        type: Number,
        default: 0,
      },
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
    },
    featured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for percentage raised (for frontend progress bar)
campaignSchema.virtual('percentageRaised').get(function () {
  if (!this.targetAmount || this.targetAmount === 0) return 0;
  const pct = (this.raisedAmount / this.targetAmount) * 100;
  return Number(pct.toFixed(2));
});

// Virtual for remaining amount
campaignSchema.virtual('remainingAmount').get(function () {
  const rem = this.targetAmount - this.raisedAmount;
  return rem > 0 ? rem : 0;
});

// Virtual for donations list
campaignSchema.virtual('donations', {
  ref: 'Donation',
  localField: '_id',
  foreignField: 'campaignId',
});

module.exports = mongoose.model('Campaign', campaignSchema);
