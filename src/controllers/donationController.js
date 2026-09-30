const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const Cause = require('../models/Cause');
const User = require('../models/User');
const { emitCampaignProgress } = require('../sockets/socketHandler');
const { sendDonationReceiptNotification } = require('../services/notificationService');
const { generateTaxReceipt } = require('../services/receiptService');

/**
 * Helper to generate random readable alphanumeric transaction ID
 */
const generateTransactionId = () => {
  return 'TXN_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 7).toUpperCase();
};

/**
 * Helper to generate 80G receipt number
 */
const generateReceiptNumber = () => {
  const year = new Date().getFullYear();
  const seq = Math.floor(100000 + Math.random() * 900000);
  return `GE-${year}-${seq}`;
};

/**
 * @desc    Make a donation towards a campaign
 * @route   POST /api/donations
 * @access  Public / Authenticated
 */
const createDonation = async (req, res, next) => {
  try {
    const {
      campaignId,
      amount,
      donorName,
      donorEmail,
      paymentMethod = 'UPI',
      isRecurring = false,
      recurringFrequency = 'none',
      panNumber = '',
      notes = '',
    } = req.body;

    // 1. Validate Campaign
    const campaign = await Campaign.findById(campaignId).populate('causeId');
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (campaign.status === 'completed' || campaign.status === 'paused') {
      return res.status(400).json({
        success: false,
        message: `This campaign is currently ${campaign.status}. New donations cannot be accepted.`,
      });
    }

    const donorUser = req.user || null;
    const finalDonorName = donorName || (donorUser ? donorUser.name : 'Anonymous Donor');
    const finalDonorEmail = donorEmail || (donorUser ? donorUser.email : 'supporter@giveeasy.org');
    const finalPan = panNumber || (donorUser ? donorUser.panNumber : '');

    const transactionId = generateTransactionId();
    const receiptNumber = generateReceiptNumber();

    // 2. Create Donation Record
    const donation = await Donation.create({
      donorId: donorUser ? donorUser._id : null,
      donorName: finalDonorName,
      donorEmail: finalDonorEmail,
      campaignId: campaign._id,
      causeId: campaign.causeId?._id || null,
      amount: Number(amount),
      currency: 'INR',
      paymentMethod,
      paymentStatus: 'success', // Simulated instant successful gateway verification
      transactionId,
      receiptNumber,
      isRecurring: Boolean(isRecurring),
      recurringFrequency: isRecurring ? (recurringFrequency || 'monthly') : 'none',
      recurringStatus: isRecurring ? 'active' : 'none',
      taxReceipt: {
        eligible: true,
        panNumber: finalPan,
        receiptGenerated: true,
      },
      notes,
    });

    // 3. Update Campaign Raised Amount & Donor Count atomically
    campaign.raisedAmount += Number(amount);
    campaign.donorCount += 1;

    // Increment impact metric proportionally if configured
    if (campaign.impactMetric && campaign.impactMetric.targetCount > 0) {
      const additionalImpact = Math.max(1, Math.round(Number(amount) / 100));
      campaign.impactMetric.currentCount += additionalImpact;
    }

    // Check if goal reached
    if (campaign.raisedAmount >= campaign.targetAmount) {
      campaign.status = 'completed';
    }

    await campaign.save();

    // 4. Emit Real-time Progress Update to all connected clients & campaign room
    emitCampaignProgress(campaign, donation);

    // 5. Dispatch Firebase Push Notification & Receipt
    let pushNotificationResult = null;
    try {
      const notifRes = await sendDonationReceiptNotification({
        user: donorUser,
        donation,
        campaign,
      });
      pushNotificationResult = notifRes.pushResult;
    } catch (notifErr) {
      console.warn('Notification dispatch non-fatal warning:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Donation received successfully! Campaign impact updated in real-time.',
      data: {
        donation,
        campaign: {
          id: campaign._id,
          title: campaign.title,
          targetAmount: campaign.targetAmount,
          raisedAmount: campaign.raisedAmount,
          percentageRaised: campaign.percentageRaised,
          donorCount: campaign.donorCount,
          status: campaign.status,
        },
        receiptUrl: `/api/donations/${donation._id}/receipt`,
        pushNotification: pushNotificationResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all donations (paginated)
 * @route   GET /api/donations
 * @access  Public / Private
 */
const getDonations = async (req, res, next) => {
  try {
    const { campaignId, page = 1, limit = 20 } = req.query;
    let query = { paymentStatus: 'success' };

    if (campaignId) query.campaignId = campaignId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find(query)
      .populate('campaignId', 'title imageUrl targetAmount raisedAmount')
      .populate('causeId', 'title ngoName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    res.status(200).json({
      success: true,
      count: donations.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get donations made by specific user
 * @route   GET /api/donations/user/:id
 * @access  Private
 */
const getUserDonations = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Security check: only user themselves or admin can view
    if (req.user.role !== 'admin' && req.user.id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view another user donations',
      });
    }

    const donations = await Donation.find({ donorId: userId })
      .populate('campaignId', 'title imageUrl category targetAmount raisedAmount')
      .populate('causeId', 'title ngoName')
      .sort({ createdAt: -1 });

    const totalContributed = donations.reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({
      success: true,
      count: donations.length,
      totalContributed,
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get official 80G Tax Exemption Receipt for a donation
 * @route   GET /api/donations/:id/receipt
 * @access  Public / Donor
 */
const getDonationReceipt = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('campaignId')
      .populate('causeId')
      .populate('donorId', 'name email panNumber');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation transaction not found',
      });
    }

    const receipt = generateTaxReceipt(
      donation,
      donation.campaignId,
      donation.causeId,
      donation.donorId
    );

    res.status(200).json({
      success: true,
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manage recurring donation status (pause, cancel, resume)
 * @route   PUT /api/donations/:id/recurring
 * @access  Private
 */
const manageRecurring = async (req, res, next) => {
  try {
    const { action } = req.body; // 'pause', 'cancel', 'resume'
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    if (!donation.isRecurring) {
      return res.status(400).json({
        success: false,
        message: 'This donation is not set up as a recurring donation',
      });
    }

    if (action === 'pause') donation.recurringStatus = 'paused';
    else if (action === 'cancel') donation.recurringStatus = 'cancelled';
    else if (action === 'resume') donation.recurringStatus = 'active';
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Supported actions: 'pause', 'resume', 'cancel'",
      });
    }

    await donation.save();

    res.status(200).json({
      success: true,
      message: `Recurring donation has been ${donation.recurringStatus}`,
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonation,
  getDonations,
  getUserDonations,
  getDonationReceipt,
  manageRecurring,
};
