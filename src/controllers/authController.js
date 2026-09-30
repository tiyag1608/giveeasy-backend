const User = require('../models/User');

/**
 * @desc    Register a new user (donor or NGO admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, panNumber, fcmToken } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'donor',
      phone: phone || '',
      panNumber: panNumber || '',
      fcmToken: fcmToken || '',
    });

    // Generate JWT
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        panNumber: user.panNumber,
        avatar: user.avatar,
        fcmToken: user.fcmToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and get JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user by email and explicitly include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Optional update of FCM token on login
    if (req.body.fcmToken) {
      user.fcmToken = req.body.fcmToken;
      await user.save();
    }

    // Generate JWT
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        panNumber: user.panNumber,
        avatar: user.avatar,
        fcmToken: user.fcmToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (JWT protected)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile & FCM token
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { phone, panNumber, avatar, fcmToken } = req.body;
    const user = await User.findById(req.user.id);

    if (phone !== undefined) user.phone = phone;
    if (panNumber !== undefined) user.panNumber = panNumber.toUpperCase();
    if (avatar !== undefined) user.avatar = avatar;
    if (fcmToken !== undefined) user.fcmToken = fcmToken;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
