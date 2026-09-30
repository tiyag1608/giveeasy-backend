const mongoose = require('mongoose');

const causeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide cause title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide cause description'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['Education', 'Healthcare', 'Disaster Relief', 'Animal Welfare', 'Environment', 'Child Welfare', 'Poverty Alleviation', 'Other'],
      default: 'Education',
    },
    ngoName: {
      type: String,
      required: [true, 'Please provide NGO name'],
      trim: true,
    },
    ngoRegistrationNumber: {
      type: String,
      required: [true, 'Please provide NGO registration / 12A / 80G number'],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Please provide NGO contact email'],
      lowercase: true,
      trim: true,
    },
    proofUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
      description: 'Document or certificate verification URL',
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    submittedBy: {
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

// Virtual for campaigns associated with this cause
causeSchema.virtual('campaigns', {
  ref: 'Campaign',
  localField: '_id',
  foreignField: 'causeId',
});

module.exports = mongoose.model('Cause', causeSchema);
