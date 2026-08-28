require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectDB = require('./db');
const seedDatabase = require('./seeder');
const passport = require('./config/passport');

// Initialize express app
const app = express();

// Connect to MongoDB and seed default admin/nurses
connectDB().then(() => {
  seedDatabase();
});

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Express Session (required for Passport Google OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'nurse_shift_scheduling_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Base Route Health Check
app.get('/', (req, res) => {
  res.json({
    project: 'Nursing Staff Shift Scheduling System API',
    status: 'Server is running cleanly',
    database: 'MongoDB',
    authentication: ['JWT', 'Google OAuth 2.0'],
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/nurses', require('./routes/nurseRoutes'));
app.use('/api/users', require('./routes/user'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/swaps', require('./routes/swapRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'API Endpoint Not Found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start Server with EADDRINUSE Error Handling
const DEFAULT_PORT = parseInt(process.env.PORT) || 5000;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Nurse Shift Scheduling Backend Server running on port ${port}`);
    console.log(`📡 Health Check: http://localhost:${port}/`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${port} is already in use by another process.`);
      const nextPort = port + 1;
      console.log(`🔄 Retrying on port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('❌ Server startup error:', err);
    }
  });
};

startServer(DEFAULT_PORT);

module.exports = app;
