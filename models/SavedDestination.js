const mongoose = require('mongoose');

const savedDestinationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  destinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: [true, 'Destination ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can't save the same destination twice
savedDestinationSchema.index({ userId: 1, destinationId: 1 }, { unique: true });

// Index for efficient user-based queries
savedDestinationSchema.index({ userId: 1, createdAt: -1 });

// Index for destination-based queries (to count saves)
savedDestinationSchema.index({ destinationId: 1 });

module.exports = mongoose.model('SavedDestination', savedDestinationSchema);
