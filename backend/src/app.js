const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Routes
const authRoutes = require('./routes/auth.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const subjectRoutes = require('./routes/subject.routes');

// Middleware
const { errorHandler } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();

// =====================
// 🔐 Security
// =====================
app.use(helmet());

// =====================
// 🌍 CORS — ALLOW ALL LOCALHOST PORTS
// =====================
app.use(cors({
  origin: (origin, callback) => {
    // allow postman / curl
    if (!origin) return callback(null, true);

    // allow any localhost port (4200, 60788, etc.)
    if (origin.startsWith('http://localhost')) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// =====================
// 📦 Body Parsers
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// 🗜️ Compression
// =====================
app.use(compression());

// =====================
// 📝 Logging
// =====================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// =====================
// 🚦 Rate Limiting
// =====================
app.use('/api', apiLimiter);

// =====================
// ❤️ Health Check
// =====================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// =====================
// 🚀 API Routes
// =====================
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);

// =====================
// ❌ 404 Handler
// =====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// =====================
// 💥 Global Error Handler
// =====================
app.use(errorHandler);

module.exports = app;
