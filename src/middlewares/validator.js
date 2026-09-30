const { check, validationResult } = require('express-validator');

// Result validation handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Register validation rules
const registerRules = [
  check('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters'),
  check('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  check('role')
    .optional()
    .isIn(['donor', 'admin', 'ngo_admin'])
    .withMessage('Role must be one of: donor, admin, ngo_admin'),
];

// Login validation rules
const loginRules = [
  check('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  check('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Campaign validation rules
const campaignRules = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Campaign title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  check('description')
    .notEmpty()
    .withMessage('Campaign description is required'),
  check('causeId')
    .isMongoId()
    .withMessage('Valid Cause ObjectId is required'),
  check('targetAmount')
    .isNumeric()
    .withMessage('Target amount must be a number')
    .custom((val) => val >= 100)
    .withMessage('Target amount must be at least ₹100'),
];

// Cause validation rules
const causeRules = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Cause title is required'),
  check('description')
    .notEmpty()
    .withMessage('Cause description is required'),
  check('ngoName')
    .trim()
    .notEmpty()
    .withMessage('NGO name is required'),
  check('ngoRegistrationNumber')
    .trim()
    .notEmpty()
    .withMessage('NGO Registration/12A/80G number is required'),
  check('contactEmail')
    .isEmail()
    .withMessage('Valid NGO contact email is required')
    .normalizeEmail(),
];

// Donation validation rules
const donationRules = [
  check('campaignId')
    .isMongoId()
    .withMessage('Valid Campaign ObjectId is required'),
  check('amount')
    .isNumeric()
    .withMessage('Donation amount must be a number')
    .custom((val) => val >= 1)
    .withMessage('Donation amount must be at least ₹1'),
  check('donorName')
    .trim()
    .notEmpty()
    .withMessage('Donor name is required'),
  check('donorEmail')
    .isEmail()
    .withMessage('Valid donor email is required')
    .normalizeEmail(),
];

// Notification validation rules
const notificationRules = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Notification title is required'),
  check('body')
    .trim()
    .notEmpty()
    .withMessage('Notification body is required'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  campaignRules,
  causeRules,
  donationRules,
  notificationRules,
};
