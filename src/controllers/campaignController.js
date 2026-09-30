const Campaign = require('../models/Campaign');
const Cause = require('../models/Cause');

/**
 * @desc    Get all campaigns with filters, pagination & progress calculation
 * @route   GET /api/campaigns
 * @access  Public
 */
const getCampaigns = async (req, res, next) => {
  try {
    const { category, causeId, status, search, sort, page = 1, limit = 20 } = req.query;
    let query = {};

    if (category) query.category = category;
    if (causeId) query.causeId = causeId;
    if (status) {
      query.status = status;
    } else {
      query.status = 'active'; // default show active
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'popular') sortOptions = { donorCount: -1 };
    if (sort === 'raised') sortOptions = { raisedAmount: -1 };
    if (sort === 'urgent') sortOptions = { endDate: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await Campaign.find(query)
      .populate('causeId', 'title ngoName status proofUrl')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(query);

    res.status(200).json({
      success: true,
      count: campaigns.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single campaign by ID with impact data & recent donors
 * @route   GET /api/campaigns/:id
 * @access  Public
 */
const getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('causeId')
      .populate({
        path: 'donations',
        options: { limit: 10, sort: { createdAt: -1 } },
        select: 'donorName amount createdAt paymentMethod',
      });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new fundraising campaign
 * @route   POST /api/campaigns
 * @access  Private (Admin / NGO)
 */
const createCampaign = async (req, res, next) => {
  try {
    const {
      title,
      description,
      causeId,
      targetAmount,
      category,
      imageUrl,
      startDate,
      endDate,
      impactMetric,
      featured,
    } = req.body;

    // Verify cause exists and is verified
    const cause = await Cause.findById(causeId);
    if (!cause) {
      return res.status(404).json({
        success: false,
        message: 'Associated cause not found',
      });
    }

    if (cause.status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: `Cannot launch campaign for an unverified cause. Current cause status: ${cause.status}`,
      });
    }

    const campaign = await Campaign.create({
      title,
      description,
      causeId,
      targetAmount,
      category: category || cause.category,
      imageUrl,
      startDate,
      endDate,
      impactMetric,
      featured: featured || false,
      createdBy: req.user ? req.user.id : null,
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update campaign details
 * @route   PUT /api/campaigns/:id
 * @access  Private (Admin / NGO)
 */
const updateCampaign = async (req, res, next) => {
  try {
    let campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Role verification (admin can update any, ngo can update their own)
    if (
      req.user.role !== 'admin' &&
      campaign.createdBy &&
      campaign.createdBy.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this campaign',
      });
    }

    campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('causeId');

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete campaign
 * @route   DELETE /api/campaigns/:id
 * @access  Private (Admin only)
 */
const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    await campaign.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
};
