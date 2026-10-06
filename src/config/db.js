const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/giveeasy';
    const uri = rawUri.trim();
    const conn = await mongoose.connect(uri);
    global.lastMongoError = null;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    global.lastMongoError = error.message;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️ Server running; MongoDB connection will be retried automatically on subsequent queries.');
  }
};

module.exports = connectDB;
