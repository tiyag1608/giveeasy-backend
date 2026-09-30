const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { registerRules, loginRules, validate } = require('../middlewares/validator');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerRules, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and retrieve JWT token
 * @access  Public
 */
router.post('/login', loginRules, validate, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged-in user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile & FCM token
 * @access  Private
 */
router.put('/profile', protect, updateProfile);

module.exports = router;
