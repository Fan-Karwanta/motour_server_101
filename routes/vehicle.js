const express = require('express');
const { body, validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @route   GET /api/vehicles
// @desc    Get all vehicles for the authenticated user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user._id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicles'
    });
  }
});

// @route   GET /api/vehicles/:id
// @desc    Get a single vehicle by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      vehicle
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicle'
    });
  }
});

// @route   POST /api/vehicles
// @desc    Add a new vehicle
// @access  Private
router.post('/', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Vehicle name is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('type').optional().isIn(['Sport', 'Cruiser', 'Touring', 'Standard', 'Dual-Sport', 'Adventure', 'Scooter', 'Off-Road', 'Other']).withMessage('Invalid vehicle type'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
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

    const { name, brand, model, type, year, engineCapacity, plateNumber, color, image } = req.body;

    const vehicle = new Vehicle({
      user: req.user._id,
      name,
      brand,
      model,
      type: type || 'Standard',
      year,
      engineCapacity,
      plateNumber,
      color,
      image
    });

    await vehicle.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      vehicle
    });
  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding vehicle'
    });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Update a vehicle
// @access  Private
router.put('/:id', authenticateToken, [
  body('name').optional().trim().notEmpty().withMessage('Vehicle name cannot be empty'),
  body('brand').optional().trim().notEmpty().withMessage('Brand cannot be empty'),
  body('type').optional().isIn(['Sport', 'Cruiser', 'Touring', 'Standard', 'Dual-Sport', 'Adventure', 'Scooter', 'Off-Road', 'Other']).withMessage('Invalid vehicle type'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
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

    const { name, brand, model, type, year, engineCapacity, plateNumber, color, image } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (type !== undefined) updateData.type = type;
    if (year !== undefined) updateData.year = year;
    if (engineCapacity !== undefined) updateData.engineCapacity = engineCapacity;
    if (plateNumber !== undefined) updateData.plateNumber = plateNumber;
    if (color !== undefined) updateData.color = color;
    if (image !== undefined) updateData.image = image;
    updateData.updatedAt = Date.now();

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating vehicle'
    });
  }
});

// @route   DELETE /api/vehicles/:id
// @desc    Delete a vehicle (soft delete)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting vehicle'
    });
  }
});

// @route   POST /api/vehicles/:id/upload-image
// @desc    Upload vehicle image to Cloudinary
// @access  Private
router.post('/:id/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check if vehicle exists and belongs to user
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'motour/vehicles',
          transformation: [
            { width: 800, height: 600, crop: 'fill' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update vehicle with new image URL
    vehicle.image = result.secure_url;
    vehicle.updatedAt = Date.now();
    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle image uploaded successfully',
      image: result.secure_url,
      vehicle
    });
  } catch (error) {
    console.error('Vehicle image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading image'
    });
  }
});

module.exports = router;
