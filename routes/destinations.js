const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Destination = require('../models/Destination');
const Rating = require('../models/Rating');

// @route   POST /api/destinations
// @desc    Create a new destination
// @access  Private (admin only in a real app)
router.post('/', auth, async (req, res) => {
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

    const destination = new Destination({
      name,
      photos,
      geo,
      category,
      description,
      address,
      tags
    });

    await destination.save();
    
    res.status(201).json({
      success: true,
      data: destination
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
});

// @route   GET /api/destinations
// @desc    Get all destinations
// @access  Public
router.get('/', async (req, res) => {
  try {
    const destinations = await Destination.find();
    
    res.status(200).json({
      success: true,
      count: destinations.length,
      data: destinations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   GET /api/destinations/:id
// @desc    Get single destination with ratings
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        error: 'Destination not found'
      });
    }

    // Get ratings for this destination
    const ratings = await Rating.find({ destinationId: req.params.id })
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        destination,
        ratings
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   POST /api/destinations/:id/ratings
// @desc    Add rating to destination
// @access  Private
router.post('/:id/ratings', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Check if destination exists
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        error: 'Destination not found'
      });
    }

    // Check if user already rated this destination
    const existingRating = await Rating.findOne({
      destinationId: req.params.id,
      userId: req.user.id
    });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = comment || '';
      await existingRating.save();
      
      // Recalculate average rating
      await Rating.calculateAverageRating(req.params.id);
      
      return res.status(200).json({
        success: true,
        data: existingRating,
        message: 'Rating updated successfully'
      });
    } else {
      // Create new rating
      const newRating = new Rating({
        destinationId: req.params.id,
        userId: req.user.id,
        rating,
        comment: comment || ''
      });

      await newRating.save();
      
      // Populate user data
      await newRating.populate('userId', 'email name');
      
      res.status(201).json({
        success: true,
        data: newRating,
        message: 'Rating added successfully'
      });
    }
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
});

// @route   GET /api/destinations/:id/ratings
// @desc    Get ratings for a destination
// @access  Public
router.get('/:id/ratings', async (req, res) => {
  try {
    const ratings = await Rating.find({ destinationId: req.params.id })
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;
