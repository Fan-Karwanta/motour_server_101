const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Destination = require('./models/Destination');
const SavedDestination = require('./models/SavedDestination');
const Rating = require('./models/Rating');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Sample destination data
const sampleDestination = {
  name: 'Chocolate Hills',
  photos: {
    main: 'https://res.cloudinary.com/duiqacina/image/upload/v1693482731/motour/chocolate-hills.jpg',
    others: [
      'https://res.cloudinary.com/duiqacina/image/upload/v1693482732/motour/chocolate-hills-2.jpg'
    ]
  },
  geo: {
    lat: 9.8296,
    lng: 124.1444
  },
  category: 'Nature',
  description: 'Famous tourist attraction in Bohol with over 1,200 hills that turn chocolate brown during dry season.',
  address: 'Carmen, Bohol, Philippines',
  tags: ['hills', 'natural wonder', 'bohol']
};

// Initialize database with sample data
const initDB = async () => {
  const connected = await connectDB();
  
  if (!connected) {
    console.log('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  try {
    // Create destination collection by inserting a sample
    const destination = await Destination.create(sampleDestination);
    console.log('✅ Created Destination collection with sample data');
    console.log(`   ID: ${destination._id}`);
    
    // Create a sample rating
    const rating = await Rating.create({
      destinationId: destination._id,
      userId: new mongoose.Types.ObjectId(), // Dummy user ID
      rating: 5,
      comment: 'Amazing place to visit!'
    });
    console.log('✅ Created Rating collection with sample data');
    
    // Create a sample saved destination
    const savedDestination = await SavedDestination.create({
      userId: new mongoose.Types.ObjectId(), // Dummy user ID
      destinationId: destination._id
    });
    console.log('✅ Created SavedDestination collection with sample data');
    
    console.log('\n🎉 Database initialized successfully!');
    console.log('👉 Check your MongoDB Atlas dashboard - all collections should now be visible.');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
};

// Run the initialization
initDB();
