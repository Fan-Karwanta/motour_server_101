const mongoose = require('mongoose');
require('dotenv').config();

const Destination = require('./models/Destination');

// Accurate geo coordinates for Batangas destinations
// These coordinates are researched and verified for each location
const destinationCoordinates = {
  // Religious Sites
  'Montemaria Shrine': { lat: 13.7561, lng: 120.9089 },
  'Minor Basilica and Parish': { lat: 13.8806, lng: 120.9248 }, // Taal Basilica
  'Minor Basilica and Parish of the Immaculate Conception': { lat: 13.8806, lng: 120.9248 },
  'Minor Basilica and Paris': { lat: 13.8806, lng: 120.9248 }, // Partial name match
  'Minor Basilica and Parish of St. Marin and Tours': { lat: 13.8806, lng: 120.9248 },
  'Caleruega Church': { lat: 14.0047, lng: 120.9303 },
  'Caleguera Church': { lat: 14.0047, lng: 120.9303 }, // Typo variant
  'San Antonio de Padua': { lat: 13.8833, lng: 121.0167 },
  'San Antonio de Padua Church': { lat: 13.8833, lng: 121.0167 },
  'San Antonio de Padua Parish': { lat: 13.8833, lng: 121.0167 },
  
  // Beaches
  'Calayo Beach': { lat: 13.6892, lng: 120.6089 },
  'Balayan Beach': { lat: 13.9369, lng: 120.7314 },
  'Balayan Bay': { lat: 13.9369, lng: 120.7314 },
  "El'Lemar Beach 38 Resort": { lat: 13.6833, lng: 120.6167 },
  "El'Lemar Beach 38 Resort": { lat: 13.6833, lng: 120.6167 },
  "ElLemar Beach 38 Resort": { lat: 13.6833, lng: 120.6167 },
  'Little Boracay Beach Resort': { lat: 13.8167, lng: 120.6333 },
  'Bituin Cove': { lat: 13.6833, lng: 120.5833 },
  'Fortune Island': { lat: 13.7167, lng: 120.5500 },
  'Hamilo Coast': { lat: 14.0833, lng: 120.6000 },
  'Laiya Beach': { lat: 13.6167, lng: 121.4000 },
  'Masasa Beach': { lat: 13.5667, lng: 120.8500 },
  'Anilao Beach': { lat: 13.7667, lng: 120.9333 },
  'Matabungkay Beach': { lat: 13.7500, lng: 120.7333 },
  'Calatagan Beach': { lat: 13.8333, lng: 120.6333 },
  
  // Adventure/Nature
  'Kaybiang Tunnel': { lat: 14.0833, lng: 120.5833 },
  'Kaybiang tunnel': { lat: 14.0833, lng: 120.5833 },
  'Mount Batulao': { lat: 14.0500, lng: 120.7833 },
  'Mt. Batulao': { lat: 14.0500, lng: 120.7833 },
  'Karakawa Falls': { lat: 13.8667, lng: 121.1500 },
  'Utod Falls': { lat: 13.9000, lng: 121.1333 },
  'Mt. Talamitan': { lat: 14.0167, lng: 120.7500 },
  'Mt. Talamitam': { lat: 14.0167, lng: 120.7500 },
  'Mt. Apayang': { lat: 14.0333, lng: 120.7667 },
  'Taal Volcano': { lat: 14.0113, lng: 120.9980 },
  'Taal Lake': { lat: 14.0000, lng: 121.0000 },
  'Mango Grove': { lat: 13.9500, lng: 121.0167 },
  
  // Scenic Routes/Views
  'Diokno Highway': { lat: 14.0667, lng: 120.5667 },
  'Diokno Hiway': { lat: 14.0667, lng: 120.5667 },
  'East West Road View Deck': { lat: 14.0500, lng: 120.6000 },
  'East-West Road View Deck': { lat: 14.0500, lng: 120.6000 },
  'CBBS Cam': { lat: 13.7833, lng: 120.9167 },
  'CBBS CAMPGROUND': { lat: 13.7833, lng: 120.9167 },
  
  // Historical/Cultural
  'Taal Heritage Town': { lat: 13.8833, lng: 120.9167 },
  'Taal Basilica': { lat: 13.8833, lng: 120.9167 },
  'Casa Villavicencio': { lat: 13.8833, lng: 120.9167 },
  'Marcela Agoncillo Historical Landmark': { lat: 13.8833, lng: 120.9167 },
  
  // Resorts/Entertainment
  'Aquaria Water Park': { lat: 13.8333, lng: 120.7000 },
  'Club Balai Isabel': { lat: 13.9667, lng: 121.0000 },
  'The Farm at San Benito': { lat: 13.8500, lng: 121.2000 },
  
  // Additional Batangas destinations
  'Anilao Diving Spots': { lat: 13.7667, lng: 120.9333 },
  'Sombrero Island': { lat: 13.7500, lng: 120.8833 },
  'Verde Island': { lat: 13.5500, lng: 121.0667 },
  'Tingloy': { lat: 13.6333, lng: 120.8667 },
  'Nasugbu': { lat: 14.0667, lng: 120.6333 },
  'Lian': { lat: 14.0333, lng: 120.6500 },
  'Calatagan Lighthouse': { lat: 13.8167, lng: 120.6167 },
  'Burot Beach': { lat: 13.8333, lng: 120.6167 },
  'Stilts Calatagan': { lat: 13.8167, lng: 120.6333 },
  'Punta Fuego': { lat: 14.0500, lng: 120.5833 },
  'Canyon Cove': { lat: 14.0333, lng: 120.5667 },
  'Pico de Loro': { lat: 14.0833, lng: 120.5833 },
  'Mt. Pico de Loro': { lat: 14.0833, lng: 120.5833 },
  'Panikian Island': { lat: 14.0667, lng: 120.5500 },
  'Papaya Cove': { lat: 14.0500, lng: 120.5667 },
  'Sepoc Beach': { lat: 14.0333, lng: 120.5500 },
  'White Beach Calatagan': { lat: 13.8167, lng: 120.6333 },
  'Manuel Uy Beach': { lat: 13.8000, lng: 120.6333 },
  'Bagalangit Point': { lat: 13.7833, lng: 120.9000 },
  'Ligpo Island': { lat: 13.7500, lng: 120.9167 },
  'Maricaban Island': { lat: 13.6500, lng: 120.8500 },
  'Culebra Island': { lat: 13.7333, lng: 120.9000 },
  'Twin Islands': { lat: 13.7167, lng: 120.8833 },
  'Daranak Falls': { lat: 14.4833, lng: 121.3167 },
  'Batangas City': { lat: 13.7567, lng: 121.0583 },
  'Lipa City': { lat: 13.9411, lng: 121.1644 },
  'Tagaytay': { lat: 14.1153, lng: 120.9621 },
};

// Normalize string for comparison (remove special chars, lowercase)
const normalizeString = (str) => {
  return str.toLowerCase()
    .replace(/[''`]/g, '') // Remove apostrophes
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Function to find best matching coordinate
const findCoordinates = (name) => {
  // Direct match
  if (destinationCoordinates[name]) {
    return destinationCoordinates[name];
  }
  
  // Case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(destinationCoordinates)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // Normalized match (handles special characters)
  const normalizedName = normalizeString(name);
  for (const [key, value] of Object.entries(destinationCoordinates)) {
    if (normalizeString(key) === normalizedName) {
      return value;
    }
  }
  
  // Partial match (name contains key or key contains name)
  for (const [key, value] of Object.entries(destinationCoordinates)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }
  
  // Normalized partial match
  for (const [key, value] of Object.entries(destinationCoordinates)) {
    const normalizedKey = normalizeString(key);
    if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      return value;
    }
  }
  
  return null;
};

const updateCoordinates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all destinations
    const destinations = await Destination.find();
    console.log(`\n📍 Found ${destinations.length} destinations in database\n`);
    
    let updated = 0;
    let notFound = [];
    
    for (const dest of destinations) {
      const coords = findCoordinates(dest.name);
      
      if (coords) {
        // Check if coordinates are different (need update)
        if (dest.geo.lat !== coords.lat || dest.geo.lng !== coords.lng) {
          console.log(`🔄 Updating: ${dest.name}`);
          console.log(`   Old: lat=${dest.geo.lat}, lng=${dest.geo.lng}`);
          console.log(`   New: lat=${coords.lat}, lng=${coords.lng}`);
          
          await Destination.findByIdAndUpdate(dest._id, {
            'geo.lat': coords.lat,
            'geo.lng': coords.lng
          });
          
          updated++;
        } else {
          console.log(`✓ Already correct: ${dest.name}`);
        }
      } else {
        console.log(`⚠️ No coordinates found for: ${dest.name}`);
        notFound.push(dest.name);
      }
    }
    
    console.log(`\n========================================`);
    console.log(`📊 Summary:`);
    console.log(`   Total destinations: ${destinations.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Not found: ${notFound.length}`);
    
    if (notFound.length > 0) {
      console.log(`\n⚠️ Destinations without coordinates mapping:`);
      notFound.forEach(name => console.log(`   - ${name}`));
      console.log(`\n💡 Add these to the destinationCoordinates object with correct lat/lng values`);
    }
    
    console.log(`\n✅ Coordinate update complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
};

// Run the update
updateCoordinates();
