const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173', // Local admin panel
  'https://motour-admin-panel.vercel.app', // Production admin panel
  'http://localhost:3000', // Local client
  'exp://192.168.1.230:8081', // Expo development
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/saved-destinations', require('./routes/savedDestinations'));
app.use('/api/vehicles', require('./routes/vehicle'));

// Admin Routes
app.use('/admin/auth', require('./routes/admin/auth'));
app.use('/admin/users', require('./routes/admin/users'));
app.use('/admin/destinations', require('./routes/admin/destinations'));
app.use('/admin/ratings', require('./routes/admin/ratings'));
app.use('/admin/metrics', require('./routes/admin/metrics'));
app.use('/admin/uploads', require('./routes/admin/uploads'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Motour API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Motour API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📱 Mobile access: http://192.168.1.8:${PORT}/api/health`);
});
