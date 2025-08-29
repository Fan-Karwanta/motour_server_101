const express = require('express');
const router = express.Router();
const SavedDestination = require('../models/SavedDestination');
const Destination = require('../models/Destination');
const auth = require('../middleware/auth');

// Get user's saved destinations
router.get('/', auth, async (req, res) => {
  try {
    const savedDestinations = await SavedDestination.find({ userId: req.user._id })
      .populate('destinationId')
      .sort({ createdAt: -1 });

    const destinations = savedDestinations.map(saved => saved.destinationId);
    
    res.json({
      success: true,
      data: destinations
    });
  } catch (error) {
    console.error('Error fetching saved destinations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved destinations'
    });
  }
});

// Save/unsave a destination
router.post('/:destinationId', auth, async (req, res) => {
  try {
    const { destinationId } = req.params;
    const userId = req.user._id;

    // Check if destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    // Check if already saved
    const existingSave = await SavedDestination.findOne({
      userId,
      destinationId
    });

    if (existingSave) {
      // Remove from saved destinations
      await SavedDestination.deleteOne({ _id: existingSave._id });
      
      res.json({
        success: true,
        message: 'Destination removed from saved list',
        isSaved: false
      });
    } else {
      // Add to saved destinations
      const savedDestination = new SavedDestination({
        userId,
        destinationId
      });
      
      await savedDestination.save();
      
      res.json({
        success: true,
        message: 'Destination saved successfully',
        isSaved: true
      });
    }
  } catch (error) {
    console.error('Error toggling saved destination:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update saved destination'
    });
  }
});

// Check if destination is saved by user
router.get('/check/:destinationId', auth, async (req, res) => {
  try {
    const { destinationId } = req.params;
    const userId = req.user._id;

    const savedDestination = await SavedDestination.findOne({
      userId,
      destinationId
    });

    res.json({
      success: true,
      isSaved: !!savedDestination
    });
  } catch (error) {
    console.error('Error checking saved destination:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check saved destination status'
    });
  }
});

// Get saved destinations count for a destination
router.get('/count/:destinationId', async (req, res) => {
  try {
    const { destinationId } = req.params;
    
    const count = await SavedDestination.countDocuments({ destinationId });
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting saved count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved count'
    });
  }
});

// Get count of saved destinations for current user
router.get('/user/count', auth, async (req, res) => {
  try {
    const count = await SavedDestination.countDocuments({ userId: req.user._id });
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting user saved count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user saved count'
    });
  }
});

module.exports = router;
