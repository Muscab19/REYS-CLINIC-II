const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS configuration - Updated for production
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173',
    'http://161.35.107.64',
    'http://161.35.107.64:3000',
    'http://reysclinic.com',
    'https://reysclinic.com',
    'http://www.reysclinic.com',
    'https://www.reysclinic.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorMasterDataRoutes = require('./routes/doctorMasterDataRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const labTestRoutes = require('./routes/labTestRoutes')
const labRequests = require('./routes/labRequests');
const salesRoutes = require('./routes/sales');
const inpatientRoutes = require('./routes/inpatients');
const labPaymentRoutes = require('./routes/labPayments');
const revenueRoutes = require('./routes/revenueRoutes');
const labTestCategoryRoutes = require('./routes/lab-test-categories');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctor-master', doctorMasterDataRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/lab-tests', labTestRoutes)
app.use('/api/lab-requests', labRequests);
app.use('/api/sales', salesRoutes);
app.use('/api/inpatients', inpatientRoutes);
app.use('/api/lab-payments', labPaymentRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/lab-test-categories', labTestCategoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'REYS CLINIC API is running', 
    timestamp: new Date().toISOString(),
    server: 'reysclinic.com',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, msg: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, msg: 'Validation failed', errors: messages });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ success: false, msg: `${field} already exists` });
  }
  
  res.status(500).json({ success: false, msg: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 REYS CLINIC API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Allowed CORS origins: Production domains enabled`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
