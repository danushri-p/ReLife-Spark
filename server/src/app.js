import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Routes
import healthRoutes from './routes/healthRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import diagnosisRoutes from './routes/diagnosisRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import repairRoutes from './routes/repairRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman) or matching origin
      if (!origin || origin === clientUrl || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logger for development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/repair', repairRoutes);
app.use('/api/assistant', assistantRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.json({
    name: 'ReLife-Spark API Server',
    tagline: 'Know before you pay.',
    documentation: '/api/health',
    status: 'ONLINE',
  });
});

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`,
  });
});

// Centralized Error Handling
app.use(errorHandler);

export default app;

