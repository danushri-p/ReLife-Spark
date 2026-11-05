import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas / local MongoDB
connectDB();

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 ReLife-Spark Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

// Port already taken (usually another copy of this server running in a different terminal)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use — another ReLife-Spark server is probably already running.`);
    console.error(`   Use that one, or stop it first (Ctrl+C in its terminal). To find it: netstat -ano | findstr :${PORT}`);
    process.exit(1);
  }
  throw err;
});

// Graceful shutdown handling
const handleGracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down server gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

