const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    process.env.USE_MOCK_DB = 'true';
    console.log('Testing Mode: Using mock database');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collabmind';
    
    console.log('Attempting to connect to MongoDB...');
    
    // Connect with a 2-second timeout so it fails fast if MongoDB is not running
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
    });

    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    process.env.USE_MOCK_DB = 'false';
  } catch (error) {
    console.warn('\n================================================================');
    console.warn('⚠️  MONGODB CONNECTION FAILED:', error.message);
    console.warn('🔄  FALLING BACK TO LOCAL FILE-BASED DATABASE (server/data/db.json)');
    console.warn('ℹ️  No MongoDB installation or configuration is required to run.');
    console.warn('================================================================\n');
    
    process.env.USE_MOCK_DB = 'true';
  }
};

module.exports = connectDB;
