const express = require('express');
const router = express.Router();
const {
  getCauses,
  getCauseById,
  createCause,
  updateCause,
} = require('../controllers/causeController');
const { protect, optionalAuth } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { causeRules, validate } = require('../middlewares/validator');

/**
 * @route   GET /api/causes
 * @desc    Get all causes (Public: verified; Admin: all)
 * @access  Public / Optional Auth
 */
router.get('/', optionalAuth, getCauses);

/**
 * @route   GET /api/causes/:id
 * @desc    Get cause details by ID
 * @access  Public
 */
router.get('/:id', getCauseById);

/**
 * @route   POST /api/causes
 * @desc    Submit a cause (admin or NGO)
 * @access  Private
 */
router.post('/', protect, causeRules, validate, createCause);

/**
 * @route   PUT /api/causes/:id
 * @desc    Verify or update cause status (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id', protect, authorize('admin'), updateCause);

module.exports = router;
