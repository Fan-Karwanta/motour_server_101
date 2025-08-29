const express = require('express');
const User = require('../../models/User');
const SavedDestination = require('../../models/SavedDestination');
const { adminAuth, checkRole } = require('../../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users with pagination and search
// @access  Private (Admin)
router.get('/', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { q, page = 1, limit = 10, status, verified } = req.query;
    
    // Build query
    let query = {};
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user
// @access  Private (Admin)
router.get('/:id', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin)
router.patch('/:id', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { isVerified, phone, name, location, tripsCompleted, favoriteDestinations, totalDistance } = req.body;
    
    const updateFields = {};
    if (isVerified !== undefined) updateFields.isVerified = isVerified;
    if (phone !== undefined) updateFields.phone = phone;
    if (name !== undefined) updateFields.name = name;
    if (location !== undefined) updateFields.location = location;
    if (tripsCompleted !== undefined) updateFields.tripsCompleted = tripsCompleted;
    if (favoriteDestinations !== undefined) updateFields.favoriteDestinations = favoriteDestinations;
    if (totalDistance !== undefined) updateFields.totalDistance = totalDistance;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/users/:id/block
// @desc    Block user
// @access  Private (Admin)
router.post('/:id/block', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'blocked' },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User blocked successfully',
      user
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/users/:id/unblock
// @desc    Unblock user
// @access  Private (Admin)
router.post('/:id/unblock', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User unblocked successfully',
      user
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users/:id/saved-destinations
// @desc    Get user's saved destinations
// @access  Private (Admin)
router.get('/:id/saved-destinations', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const savedDestinations = await SavedDestination.find({ userId: req.params.id })
      .populate('destinationId', 'name photos category averageRating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await SavedDestination.countDocuments({ userId: req.params.id });
    
    res.json({
      success: true,
      savedDestinations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get saved destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
