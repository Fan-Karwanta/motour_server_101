const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  destinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: [true, 'Destination ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  media: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    thumbnail: {
      type: String // For videos, store thumbnail URL
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can only rate a destination once
ratingSchema.index({ userId: 1, destinationId: 1 }, { unique: true });

// Index for destination-based queries (to calculate average rating)
ratingSchema.index({ destinationId: 1, rating: 1 });

// Index for user-based queries
ratingSchema.index({ userId: 1, createdAt: -1 });

// Static method to calculate average rating for a destination
ratingSchema.statics.calculateAverageRating = async function(destinationId) {
  const stats = await this.aggregate([
    {
      $match: { destinationId: new mongoose.Types.ObjectId(destinationId) }
    },
    {
      $group: {
        _id: '$destinationId',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    const averageRating = Math.round(stats[0].averageRating * 10) / 10; // Round to 1 decimal place
    
    // Update the destination's average rating
    await mongoose.model('Destination').findByIdAndUpdate(destinationId, {
      averageRating: averageRating
    });
    
    return averageRating;
  } else {
    // No ratings exist, set to 0
    await mongoose.model('Destination').findByIdAndUpdate(destinationId, {
      averageRating: 0
    });
    
    return 0;
  }
};

// Post middleware to update destination average rating after save
ratingSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.destinationId);
});

// Post middleware to update destination average rating after remove
ratingSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.destinationId);
});

module.exports = mongoose.model('Rating', ratingSchema);
