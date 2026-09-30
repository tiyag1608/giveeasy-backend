const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { campaignRules, validate } = require('../middlewares/validator');

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns (filterable by category, search, sort, pagination)
 * @access  Public
 */
router.get('/', getCampaigns);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get campaign by ID
 * @access  Public
 */
router.get('/:id', getCampaignById);

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign (Admin or NGO)
 * @access  Private (Admin / NGO Admin)
 */
router.post('/', protect, authorize('admin', 'ngo_admin'), campaignRules, validate, createCampaign);

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update a campaign
 * @access  Private (Admin / NGO Admin)
 */
router.put('/:id', protect, authorize('admin', 'ngo_admin'), updateCampaign);

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete a campaign
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), deleteCampaign);

module.exports = router;
