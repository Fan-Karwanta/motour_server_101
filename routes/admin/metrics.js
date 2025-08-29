const express = require('express');
const User = require('../../models/User');
const Destination = require('../../models/Destination');
const Rating = require('../../models/Rating');
const SavedDestination = require('../../models/SavedDestination');
const { adminAuth, checkRole } = require('../../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/admin/metrics/overview
// @desc    Get dashboard metrics
// @access  Private (Admin)
router.get('/overview', adminAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    
    switch (range) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case 'all':
      default:
        dateFilter = {};
        break;
    }

    // User metrics
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments(dateFilter);
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const blockedUsers = await User.countDocuments({ status: 'blocked' });

    // Destination metrics
    const totalDestinations = await Destination.countDocuments();
    const newDestinations = await Destination.countDocuments(dateFilter);
    
    // Destinations by category
    const destinationsByCategory = await Destination.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top rated destinations
    const topRatedDestinations = await Destination.find()
      .sort({ averageRating: -1 })
      .limit(5)
      .select('name averageRating category photos.main');

    // Rating metrics
    const totalRatings = await Rating.countDocuments();
    const newRatings = await Rating.countDocuments(dateFilter);
    
    // Average rating overall
    const avgRatingResult = await Rating.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
    const overallAverageRating = avgRatingResult.length > 0 ? 
      Math.round(avgRatingResult[0].averageRating * 10) / 10 : 0;

    // Ratings per destination (top 5)
    const ratingsPerDestination = await Rating.aggregate([
      {
        $group: {
          _id: '$destinationId',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'destinations',
          localField: '_id',
          foreignField: '_id',
          as: 'destination'
        }
      },
      {
        $project: {
          destinationName: { $arrayElemAt: ['$destination.name', 0] },
          count: 1,
          averageRating: { $round: ['$averageRating', 1] }
        }
      }
    ]);

    // Saved destinations metrics
    const totalSavedDestinations = await SavedDestination.countDocuments();
    const newSavedDestinations = await SavedDestination.countDocuments(dateFilter);

    // Saved destinations trend (last 30 days)
    const savedDestinationsTrend = await SavedDestination.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // User registration trend (last 30 days)
    const userRegistrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      metrics: {
        users: {
          total: totalUsers,
          new: newUsers,
          verified: verifiedUsers,
          blocked: blockedUsers,
          registrationTrend: userRegistrationTrend
        },
        destinations: {
          total: totalDestinations,
          new: newDestinations,
          byCategory: destinationsByCategory,
          topRated: topRatedDestinations
        },
        ratings: {
          total: totalRatings,
          new: newRatings,
          overallAverage: overallAverageRating,
          perDestination: ratingsPerDestination
        },
        savedDestinations: {
          total: totalSavedDestinations,
          new: newSavedDestinations,
          trend: savedDestinationsTrend
        }
      }
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
