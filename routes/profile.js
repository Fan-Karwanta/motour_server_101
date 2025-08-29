const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate member since from createdAt
    const memberSince = user.createdAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        profileImage: user.profileImage || '',
        location: user.location || 'Philippines',
        tripsCompleted: user.tripsCompleted || 0,
        favoriteDestinations: user.favoriteDestinations || 0,
        totalDistance: user.totalDistance || '0 km',
        memberSince: memberSince
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   POST /api/profile/upload-image
// @desc    Upload profile image to Cloudinary and update user
// @access  Private
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'motour/profiles',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update user profile with new image URL
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: result.secure_url },
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
      message: 'Profile image uploaded successfully',
      profileImage: result.secure_url
    });

  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading image'
    });
  }
});

// @route   PUT /api/profile/image
// @desc    Update profile image URL
// @access  Private
router.put('/image', authenticateToken, [
  body('profileImage').notEmpty().withMessage('Profile image URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage },
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
      message: 'Profile image updated successfully',
      profileImage: user.profileImage
    });

  } catch (error) {
    console.error('Profile image update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile image'
    });
  }
});

// @route   PUT /api/profile/email
// @desc    Update email address
// @access  Private
router.put('/email', authenticateToken, [
  body('email').isEmail().withMessage('Please enter a valid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another user'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { email },
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
      message: 'Email updated successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Email update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating email'
    });
  }
});

// @route   PUT /api/profile/phone
// @desc    Update phone number
// @access  Private
router.put('/phone', authenticateToken, [
  body('phone').isMobilePhone().withMessage('Please enter a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { phone },
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
      message: 'Phone number updated successfully',
      phone: user.phone
    });

  } catch (error) {
    console.error('Phone update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating phone number'
    });
  }
});

// @route   PUT /api/profile/stats
// @desc    Update user statistics (for admin use or when completing trips)
// @access  Private
router.put('/stats', authenticateToken, [
  body('tripsCompleted').optional().isInt({ min: 0 }).withMessage('Trips completed must be a non-negative integer'),
  body('favoriteDestinations').optional().isInt({ min: 0 }).withMessage('Favorite destinations must be a non-negative integer'),
  body('totalDistance').optional().isString().withMessage('Total distance must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tripsCompleted, favoriteDestinations, totalDistance } = req.body;
    const updateData = {};

    if (tripsCompleted !== undefined) updateData.tripsCompleted = tripsCompleted;
    if (favoriteDestinations !== undefined) updateData.favoriteDestinations = favoriteDestinations;
    if (totalDistance !== undefined) updateData.totalDistance = totalDistance;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
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
      message: 'User statistics updated successfully',
      stats: {
        tripsCompleted: user.tripsCompleted,
        favoriteDestinations: user.favoriteDestinations,
        totalDistance: user.totalDistance
      }
    });

  } catch (error) {
    console.error('Stats update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating statistics'
    });
  }
});

module.exports = router;
