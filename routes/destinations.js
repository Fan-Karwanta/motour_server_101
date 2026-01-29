const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');
const Destination = require('../models/Destination');
const Rating = require('../models/Rating');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

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
    const { rating, comment, media } = req.body;
    
    // Check if destination exists
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        error: 'Destination not found'
      });
    }

    // Validate media array (max 3 files)
    if (media && media.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 3 media files allowed per review'
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
      if (media) {
        existingRating.media = media;
      }
      await existingRating.save();
      
      // Recalculate average rating
      await Rating.calculateAverageRating(req.params.id);
      
      // Populate user data
      await existingRating.populate('userId', 'email name');
      
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
        comment: comment || '',
        media: media || []
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

// @route   POST /api/destinations/upload-media
// @desc    Upload media (image/video) for reviews
// @access  Private
router.post('/upload-media', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No media file provided'
      });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: 'motour/reviews',
        resource_type: resourceType,
      };

      // Add transformations for images only
      if (!isVideo) {
        uploadOptions.transformation = [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ];
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Generate thumbnail URL for videos
    let thumbnail = null;
    if (isVideo) {
      thumbnail = result.secure_url
        .replace('/video/upload/', '/video/upload/so_0,w_400,h_300,c_fill/')
        .replace(/\.[^.]+$/, '.jpg');
    }

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        type: isVideo ? 'video' : 'image',
        thumbnail
      }
    });

  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload media'
    });
  }
});

module.exports = router;
