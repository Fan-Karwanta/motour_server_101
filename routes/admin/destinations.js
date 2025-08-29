const express = require('express');
const Destination = require('../../models/Destination');
const Rating = require('../../models/Rating');
const { adminAuth, checkRole } = require('../../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/admin/destinations
// @desc    Get all destinations with pagination and search
// @access  Private (Admin)
router.get('/', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { q, category, tag, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const destinations = await Destination.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Destination.countDocuments(query);
    
    res.json({
      success: true,
      destinations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/destinations/:id
// @desc    Get single destination
// @access  Private (Admin)
router.get('/:id', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }
    
    res.json({
      success: true,
      destination
    });
  } catch (error) {
    console.error('Get destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/destinations
// @desc    Create destination
// @access  Private (Admin)
router.post('/', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const {
      name,
      photos,
      geo,
      category,
      description,
      address,
      tags
    } = req.body;

    // Validate required fields
    if (!name || !photos?.main || !geo?.lat || !geo?.lng || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, main photo, coordinates, and category are required'
      });
    }

    const destination = new Destination({
      name,
      photos,
      geo,
      category,
      description,
      address,
      tags: tags || []
    });

    await destination.save();
    
    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      destination
    });
  } catch (error) {
    console.error('Create destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/admin/destinations/:id
// @desc    Update destination
// @access  Private (Admin)
router.patch('/:id', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const {
      name,
      photos,
      geo,
      category,
      description,
      address,
      tags
    } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (photos !== undefined) updateFields.photos = photos;
    if (geo !== undefined) updateFields.geo = geo;
    if (category !== undefined) updateFields.category = category;
    if (description !== undefined) updateFields.description = description;
    if (address !== undefined) updateFields.address = address;
    if (tags !== undefined) updateFields.tags = tags;

    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Destination updated successfully',
      destination
    });
  } catch (error) {
    console.error('Update destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/destinations/:id
// @desc    Delete destination
// @access  Private (Admin)
router.delete('/:id', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    // Delete associated ratings
    await Rating.deleteMany({ destinationId: req.params.id });
    
    // Delete the destination
    await Destination.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Destination deleted successfully'
    });
  } catch (error) {
    console.error('Delete destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
