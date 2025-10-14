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

// @route   GET /api/destinations/map/markers
// @desc    Get all destinations with valid coordinates for map display
// @access  Public
router.get('/map/markers', async (req, res) => {
  try {
    // Fetch all destinations
    const destinations = await Destination.find();
    
    // Filter destinations with valid coordinates
    const validDestinations = destinations.filter(dest => {
      // Check if geo object exists
      if (!dest.geo || typeof dest.geo.lat !== 'number' || typeof dest.geo.lng !== 'number') {
        return false;
      }
      
      // Validate latitude range (-90 to 90)
      if (dest.geo.lat < -90 || dest.geo.lat > 90) {
        return false;
      }
      
      // Validate longitude range (-180 to 180)
      if (dest.geo.lng < -180 || dest.geo.lng > 180) {
        return false;
      }
      
      // Check for NaN or Infinity
      if (!isFinite(dest.geo.lat) || !isFinite(dest.geo.lng)) {
        return false;
      }
      
      return true;
    });
    
    // Map to simplified format for map markers
    const markers = validDestinations.map(dest => ({
      _id: dest._id,
      name: dest.name,
      geo: {
        lat: dest.geo.lat,
        lng: dest.geo.lng
      },
      category: dest.category,
      averageRating: dest.averageRating,
      photos: {
        main: dest.photos.main
      },
      address: dest.address || '',
      description: dest.description || ''
    }));
    
    res.status(200).json({
      success: true,
      count: markers.length,
      data: markers
    });
  } catch (error) {
    console.error('Error fetching map markers:', error);
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
