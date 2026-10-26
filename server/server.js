const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables (Checks server/.env and root .env)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const { autoSeedDatabase } = require('./seed/seedData');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins so mobile devices/desktops on LAN can communicate freely
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logger
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workflows', require('./routes/workflowRoutes'));
app.use('/api/allocation', require('./routes/allocationRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));

// Health & System Status Endpoint (Supports both /api/health and /health)
const handleHealthCheck = (req, res) => {
  const mongoose = require('mongoose');
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const dbState = states[mongoose.connection.readyState] || 'Unknown';

  res.json({
    status: 'ONLINE',
    service: 'DeptFlow 360 Express Backend',
    database: {
      engine: 'MongoDB Atlas',
      connectionState: dbState,
      isConnected: mongoose.connection.readyState === 1
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', handleHealthCheck);
app.get('/health', handleHealthCheck);

// Root API Greeting
const handleRootGreeting = (req, res) => {
  res.json({
    message: 'DeptFlow 360 REST API Server is running.',
    healthCheck: '/api/health',
    endpoints: ['/api/auth', '/api/workflows', '/api/allocation', '/api/faculty']
  });
};

app.get('/api', handleRootGreeting);
app.get('/', handleRootGreeting);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Initialize Database & Start Server
const startServer = async () => {
  // Start HTTP listener immediately so Nginx reverse proxy and container probes don't encounter 502/refused errors
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DeptFlow 360 Express Backend running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Cross-device access enabled across local network.`);
  });

  // Connect to MongoDB Atlas asynchronously without blocking HTTP listener
  connectDB().then(async (dbConnected) => {
    if (dbConnected) {
      await autoSeedDatabase();
    } else {
      console.warn('⚠️ Server running in degraded mode: MongoDB connection pending. Ensure MONGODB_URI is set in .env.');
    }
  }).catch((err) => {
    console.error('❌ Database connection error on startup:', err.message);
  });
};

startServer();
