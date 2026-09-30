const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyFirebaseToken } = require('../config/firebase');

/**
 * Middleware to protect routes via JWT or Firebase Auth
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check for Bearer token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    // 2. Try standard JWT verification
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'giveeasy_secret_key');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }
      req.user = user;
      return next();
    } catch (jwtErr) {
      // 3. Fallback: Check if it's a Firebase ID token
      try {
        const fbDecoded = await verifyFirebaseToken(token);
        // Find or associate local user
        let user = await User.findOne({
          $or: [{ firebaseUid: fbDecoded.uid }, { email: fbDecoded.email }],
        });

        if (!user) {
          user = await User.create({
            name: fbDecoded.name || 'Firebase User',
            email: fbDecoded.email,
            firebaseUid: fbDecoded.uid,
            password: Math.random().toString(36).substring(2) + 'Secure@123',
            role: 'donor',
          });
        }

        req.user = user;
        return next();
      } catch (fbErr) {
        // Both JWT and Firebase checks failed
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token.',
          jwtError: jwtErr.message,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication server error.',
      error: error.message,
    });
  }
};

/**
 * Optional authentication: Attaches req.user if token present, but doesn't block if missing
 */
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'giveeasy_secret_key');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // Ignored for optional
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
