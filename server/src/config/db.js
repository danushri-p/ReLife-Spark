import dns from 'node:dns';
import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas or local MongoDB instance using Mongoose.
 * Implements robust connection handling and event listeners.
 */
// Connection events are only logged once the initial connect has succeeded; failures during
// startup are reported by connectDB itself, so the expected SRV retry doesn't print noise.
let initialConnectDone = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  MONGODB_URI is not defined in environment variables. Database operations will fail until configured.');
    return;
  }

  try {
    let conn;
    try {
      conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    } catch (error) {
      // On some Windows/router setups Node can't resolve the SRV record behind mongodb+srv:// URIs.
      // Retry once using public DNS resolvers before giving up.
      if (!uri.startsWith('mongodb+srv://') || !/querySrv/i.test(error.message)) throw error;
      console.warn('⚠️  System DNS could not resolve the Atlas SRV record; using public DNS (8.8.8.8, 1.1.1.1) instead.');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    }

    initialConnectDone = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // In development or when MongoDB is optional on boot, log clearly rather than crashing immediately
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  if (!initialConnectDone) return;
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  if (!initialConnectDone) return;
  console.error(`❌ MongoDB connection event error: ${err.message}`);
});

export default connectDB;

