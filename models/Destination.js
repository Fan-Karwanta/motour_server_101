const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Destination name is required'],
    trim: true,
    maxlength: [100, 'Destination name cannot exceed 100 characters']
  },
  photos: {
    main: {
      type: String,
      required: [true, 'Main photo is required'],
      trim: true
    },
    others: {
      type: [String],
      validate: {
        validator: function(arr) {
          return arr.length <= 3;
        },
        message: 'Cannot have more than 3 additional photos'
      },
      default: []
    }
  },
  geo: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Nature', 'Historical', 'Cultural', 'Adventure', 'Beach', 'Urban', 'Religious', 'Entertainment'],
      message: 'Category must be one of: Nature, Historical, Cultural, Adventure, Beach, Urban, Religious, Entertainment'
    }
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Average rating cannot be negative'],
    max: [5, 'Average rating cannot exceed 5']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  tags: {
    type: [String],
    validate: {
      validator: function(arr) {
        return arr.length <= 10;
      },
      message: 'Cannot have more than 10 tags'
    },
    default: []
  }
}, {
  timestamps: true
});

// Index for geospatial queries
destinationSchema.index({ 'geo.lat': 1, 'geo.lng': 1 });

// Index for category-based queries
destinationSchema.index({ category: 1 });

// Index for rating-based queries
destinationSchema.index({ averageRating: -1 });

// Text index for search functionality
destinationSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

module.exports = mongoose.model('Destination', destinationSchema);
