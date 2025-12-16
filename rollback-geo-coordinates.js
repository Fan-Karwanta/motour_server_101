const mongoose = require('mongoose');
require('dotenv').config();

const Destination = require('./models/Destination');

// Original coordinates BEFORE the update (from the logs)
const originalCoordinates = {
  'Montemaria Shrine': { lat: 13.64246, lng: 121.04358 },
  'Minor Basilica and Parish of St. Marin and Tours': { lat: 13.88068, lng: 120.92481 },
  'Kaybiang tunnel': { lat: 14.2341, lng: 120.6341 },
  'Mount Batulao': { lat: 14.0379, lng: 120.8061 },
  'Calayo Beach': { lat: 1, lng: 1 },
  'Balayan Bay': { lat: 1, lng: 1 },
  'Bituin Cove': { lat: 1, lng: -1 },
  'Fortune Island': { lat: 1, lng: -1 },
  'Caleguera Church': { lat: 1, lng: 1 },
  'Diokno Hiway': { lat: 1, lng: 1 },
  'San Antonio de Padua Parish': { lat: 1, lng: -1 },
  'East-West Road View Deck': { lat: 4, lng: 2 },
  'CBBS CAMPGROUND': { lat: 4, lng: 8 },
  'Karakawa Falls': { lat: 1, lng: -1 },
  'Utod Falls': { lat: 1, lng: 1 },
  'Mt. Talamitan': { lat: 1, lng: -1 },
  'Mt. Apayang': { lat: 1, lng: 1 },
  'Mango Grove': { lat: 1, lng: 2 },
  'Hamilo Coast': { lat: 1, lng: 1 },
  "El'Lemar Beach 38 Resort": { lat: 6.53098, lng: 125.56084 },
  'Little Boracay Beach Resort': { lat: 6.56521, lng: 125.49598 },
};

const rollbackCoordinates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all destinations
    const destinations = await Destination.find();
    console.log(`\n📍 Found ${destinations.length} destinations in database\n`);
    
    let restored = 0;
    
    for (const dest of destinations) {
      const originalCoords = originalCoordinates[dest.name];
      
      if (originalCoords) {
        console.log(`🔄 Restoring: ${dest.name}`);
        console.log(`   Current: lat=${dest.geo.lat}, lng=${dest.geo.lng}`);
        console.log(`   Original: lat=${originalCoords.lat}, lng=${originalCoords.lng}`);
        
        await Destination.findByIdAndUpdate(dest._id, {
          'geo.lat': originalCoords.lat,
          'geo.lng': originalCoords.lng
        });
        
        restored++;
      } else {
        console.log(`⚠️ No original coordinates found for: ${dest.name}`);
      }
    }
    
    console.log(`\n========================================`);
    console.log(`📊 Summary:`);
    console.log(`   Total destinations: ${destinations.length}`);
    console.log(`   Restored: ${restored}`);
    console.log(`\n✅ Rollback complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
};

// Run the rollback
rollbackCoordinates();
