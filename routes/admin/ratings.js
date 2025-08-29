const express = require('express');
const Rating = require('../../models/Rating');
const { adminAuth, checkRole } = require('../../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/admin/ratings
// @desc    Get all ratings with pagination and filters
// @access  Private (Admin)
router.get('/', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { destinationId, userId, min, max, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = {};
    
    if (destinationId) {
      query.destinationId = destinationId;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (min || max) {
      query.rating = {};
      if (min) query.rating.$gte = parseInt(min);
      if (max) query.rating.$lte = parseInt(max);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const ratings = await Rating.find(query)
      .populate('destinationId', 'name photos.main category')
      .populate('userId', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Rating.countDocuments(query);
    
    res.json({
      success: true,
      ratings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/admin/ratings/:id
// @desc    Update rating
// @access  Private (Admin)
router.patch('/:id', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const updateFields = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      updateFields.rating = rating;
    }
    if (comment !== undefined) updateFields.comment = comment;
    
    const updatedRating = await Rating.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('destinationId', 'name')
     .populate('userId', 'name email');
    
    if (!updatedRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }
    
    // Recalculate average rating for the destination
    await Rating.calculateAverageRating(updatedRating.destinationId._id);
    
    res.json({
      success: true,
      message: 'Rating updated successfully',
      rating: updatedRating
    });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/ratings/:id
// @desc    Delete rating
// @access  Private (Admin)
router.delete('/:id', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }
    
    const destinationId = rating.destinationId;
    
    // Delete the rating
    await Rating.findByIdAndDelete(req.params.id);
    
    // Recalculate average rating for the destination
    await Rating.calculateAverageRating(destinationId);
    
    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
