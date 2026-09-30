const express = require('express');
const router = express.Router();
const {
  getAdminCampaigns,
  getAdminDonations,
  getAdminOverview,
} = require('../controllers/adminController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');

// Apply protection & admin role check to all admin routes
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/campaigns
 * @desc    View all campaigns with administrative stats
 * @access  Private (Admin only)
 */
router.get('/campaigns', getAdminCampaigns);

/**
 * @route   GET /api/admin/donations
 * @desc    View all donations with financial metrics & breakdown
 * @access  Private (Admin only)
 */
router.get('/donations', getAdminDonations);

/**
 * @route   GET /api/admin/overview
 * @desc    Get platform high-level metrics
 * @access  Private (Admin only)
 */
router.get('/overview', getAdminOverview);

module.exports = router;
