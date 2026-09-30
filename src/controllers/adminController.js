const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Cause = require('../models/Cause');
const User = require('../models/User');

/**
 * @desc    Get all campaigns with administrative analytics
 * @route   GET /api/admin/campaigns
 * @access  Private (Admin only)
 */
const getAdminCampaigns = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 50 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await Campaign.find(query)
      .populate('causeId', 'title ngoName status proofUrl')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCampaigns = await Campaign.countDocuments(query);

    // Compute aggregated metrics
    const stats = await Campaign.aggregate([
      {
        $group: {
          _id: null,
          totalTarget: { $sum: '$targetAmount' },
          totalRaised: { $sum: '$raisedAmount' },
          totalDonors: { $sum: '$donorCount' },
          avgRaised: { $avg: '$raisedAmount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: campaigns.length,
      pagination: {
        total: totalCampaigns,
        page: parseInt(page),
        pages: Math.ceil(totalCampaigns / limit),
      },
      summary: stats[0] || { totalTarget: 0, totalRaised: 0, totalDonors: 0, avgRaised: 0 },
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all donations with financial summaries
 * @route   GET /api/admin/donations
 * @access  Private (Admin only)
 */
const getAdminDonations = async (req, res, next) => {
  try {
    const { paymentMethod, isRecurring, page = 1, limit = 50 } = req.query;
    let query = {};

    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (isRecurring !== undefined) query.isRecurring = isRecurring === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find(query)
      .populate('campaignId', 'title category')
      .populate('causeId', 'title ngoName')
      .populate('donorId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDonationsCount = await Donation.countDocuments(query);

    // Aggregate overall financial statistics
    const financialStats = await Donation.aggregate([
      { $match: { paymentStatus: 'success' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          avgDonation: { $avg: '$amount' },
          minDonation: { $min: '$amount' },
          maxDonation: { $max: '$amount' },
        },
      },
    ]);

    // Breakdown by payment method
    const paymentBreakdown = await Donation.aggregate([
      { $match: { paymentStatus: 'success' } },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: donations.length,
      pagination: {
        total: totalDonationsCount,
        page: parseInt(page),
        pages: Math.ceil(totalDonationsCount / limit),
      },
      analytics: {
        financialSummary: financialStats[0] || {
          totalRevenue: 0,
          avgDonation: 0,
          minDonation: 0,
          maxDonation: 0,
        },
        paymentBreakdown,
      },
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    High-level platform dashboard stats
 * @route   GET /api/admin/overview
 * @access  Private (Admin only)
 */
const getAdminOverview = async (req, res, next) => {
  try {
    const [totalUsers, totalCampaigns, totalCauses, pendingCausesCount, donationAgg] = await Promise.all([
      User.countDocuments(),
      Campaign.countDocuments(),
      Cause.countDocuments(),
      Cause.countDocuments({ status: 'pending' }),
      Donation.aggregate([
        { $match: { paymentStatus: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalRaised = donationAgg[0]?.total || 0;
    const totalTransactions = donationAgg[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCampaigns,
        totalCauses,
        pendingCausesCount,
        totalRaised,
        totalTransactions,
        platformFeeCollected: totalRaised * 0.02, // 2% platform maintenance
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminCampaigns,
  getAdminDonations,
  getAdminOverview,
};
