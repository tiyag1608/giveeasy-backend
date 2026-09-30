const Cause = require('../models/Cause');
const { emitCauseStatus } = require('../sockets/socketHandler');

/**
 * @desc    Get all causes (Public: verified only, Admin: all or filterable by status)
 * @route   GET /api/causes
 * @access  Public (Enhanced if Admin)
 */
const getCauses = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    let query = {};

    // If user is not admin, only show verified causes by default
    if (!req.user || req.user.role === 'donor') {
      query.status = 'verified';
    } else if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ngoName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const causes = await Cause.find(query)
      .populate('verifiedBy', 'name email')
      .populate('campaigns')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: causes.length,
      data: causes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single cause details
 * @route   GET /api/causes/:id
 * @access  Public
 */
const getCauseById = async (req, res, next) => {
  try {
    const cause = await Cause.findById(req.params.id)
      .populate('verifiedBy', 'name email')
      .populate('campaigns');

    if (!cause) {
      return res.status(404).json({
        success: false,
        message: 'Cause not found',
      });
    }

    res.status(200).json({
      success: true,
      data: cause,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new cause
 * @route   POST /api/causes
 * @access  Private (Admin / NGO)
 */
const createCause = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      ngoName,
      ngoRegistrationNumber,
      contactEmail,
      proofUrl,
    } = req.body;

    // Default status: If created by super_admin or admin, automatically verified; else pending
    const initialStatus = (req.user && req.user.role === 'admin') ? 'verified' : 'pending';

    const cause = await Cause.create({
      title,
      description,
      category,
      ngoName,
      ngoRegistrationNumber,
      contactEmail,
      proofUrl,
      status: initialStatus,
      submittedBy: req.user ? req.user.id : null,
      verifiedBy: req.user && req.user.role === 'admin' ? req.user.id : null,
      verifiedAt: req.user && req.user.role === 'admin' ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: `Cause submitted successfully. Status: ${initialStatus}`,
      data: cause,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update or verify cause (Admin verification endpoint)
 * @route   PUT /api/causes/:id
 * @access  Private (Admin only)
 */
const updateCause = async (req, res, next) => {
  try {
    const { status, verificationNotes, title, description, category, proofUrl } = req.body;

    let cause = await Cause.findById(req.params.id);
    if (!cause) {
      return res.status(404).json({
        success: false,
        message: 'Cause not found',
      });
    }

    // Update status & admin verification fields
    if (status) {
      if (!['pending', 'verified', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be pending, verified, or rejected',
        });
      }
      cause.status = status;
      cause.verifiedBy = req.user.id;
      cause.verifiedAt = new Date();
    }

    if (verificationNotes !== undefined) cause.verificationNotes = verificationNotes;
    if (title) cause.title = title;
    if (description) cause.description = description;
    if (category) cause.category = category;
    if (proofUrl) cause.proofUrl = proofUrl;

    await cause.save();

    // Broadcast cause status update via Socket.io
    emitCauseStatus(cause);

    res.status(200).json({
      success: true,
      message: `Cause updated successfully. Current Status: ${cause.status}`,
      data: cause,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCauses,
  getCauseById,
  createCause,
  updateCause,
};
