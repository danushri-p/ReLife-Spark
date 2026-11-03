import mongoose from 'mongoose';
import geminiService from '../services/geminiService.js';

export const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ReLife-Spark Backend API',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStateMap[dbState] || 'unknown',
      isConnected: dbState === 1,
    },
    aiIntegration: {
      geminiConfigured: geminiService.isConfigured(),
      model: geminiService.defaultModel,
    },
  });
};

