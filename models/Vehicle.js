const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Vehicle name is required'],
    trim: true,
    maxlength: [100, 'Vehicle name cannot exceed 100 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [50, 'Brand cannot exceed 50 characters']
  },
  model: {
    type: String,
    trim: true,
    maxlength: [50, 'Model cannot exceed 50 characters']
  },
  type: {
    type: String,
    enum: ['Sport', 'Cruiser', 'Touring', 'Standard', 'Dual-Sport', 'Adventure', 'Scooter', 'Off-Road', 'Other'],
    default: 'Standard'
  },
  year: {
    type: Number,
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  engineCapacity: {
    type: String,
    trim: true,
    maxlength: [20, 'Engine capacity cannot exceed 20 characters']
  },
  plateNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'Plate number cannot exceed 20 characters']
  },
  color: {
    type: String,
    trim: true,
    maxlength: [30, 'Color cannot exceed 30 characters']
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
vehicleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
vehicleSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
