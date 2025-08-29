const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new AdminUser({
      username: process.env.ADMIN_SEED_USERNAME || 'admin',
      passwordHash: process.env.ADMIN_SEED_PASSWORD || 'Romel1234',
      role: process.env.ADMIN_SEED_ROLE || 'superadmin'
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log(`Username: ${admin.username}`);
    console.log(`Role: ${admin.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
