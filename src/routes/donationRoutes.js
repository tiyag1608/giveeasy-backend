const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getUserDonations,
  getDonationReceipt,
  manageRecurring,
} = require('../controllers/donationController');
const { protect, optionalAuth } = require('../middlewares/auth');
const { donationRules, validate } = require('../middlewares/validator');

/**
 * @route   POST /api/donations
 * @desc    Submit a donation (triggers live Socket.io update & Firebase push receipt)
 * @access  Public / Optional Auth
 */
router.post('/', optionalAuth, donationRules, validate, createDonation);

/**
 * @route   GET /api/donations
 * @desc    Get all donations
 * @access  Public
 */
router.get('/', getDonations);

/**
 * @route   GET /api/donations/user/:id
 * @desc    Get donation history for a specific user
 * @access  Private (Self or Admin)
 */
router.get('/user/:id', protect, getUserDonations);

/**
 * @route   GET /api/donations/:id/receipt
 * @desc    Get official 80G tax exemption receipt
 * @access  Public / Donor
 */
router.get('/:id/receipt', getDonationReceipt);

/**
 * @route   PUT /api/donations/:id/recurring
 * @desc    Pause, resume, or cancel a recurring donation
 * @access  Private
 */
router.put('/:id/recurring', protect, manageRecurring);

module.exports = router;
