const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const monetizationRoutes = require('./routes/monetizationRoutes');
const initCronJobs = require('./utils/cronJobs');

// Initialize Cron Jobs
initCronJobs();

const app = express();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ======================
// SECURITY MIDDLEWARE
// ======================

// 1. Helmet - Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 2. CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://yourproductionurl.com'
    : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body Parser with Size Limits (prevent large payload attacks)
app.use(express.json({ limit: '10mb' })); // Limit JSON payload to 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Import Rate Limiters
const {
  apiLimiter,
  authLimiter,
  accountCreationLimiter,
  jobPostingLimiter,
  applicationLimiter,
  notificationLimiter,
  profileUpdateLimiter
} = require('./middleware/security');

// 5. Apply General Rate Limiter to All API Routes
app.use('/api/', apiLimiter);

// ======================
// ROUTES WITH SPECIFIC RATE LIMITERS
// ======================

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const savedJobsRoutes = require('./routes/savedJobsRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/monetization', monetizationRoutes);

// Auth routes with strict rate limiting
app.use('/api/auth/login', authLimiter); // 5 attempts per 15 min
app.use('/api/auth/register', accountCreationLimiter); // 3 per hour
app.use('/api/auth', authRoutes(supabase));

// Job routes with posting rate limit
const jobRouter = jobRoutes(supabase);
// Apply rate limiter only to POST (job creation)
app.post('/api/jobs', jobPostingLimiter, (req, res, next) => {
  jobRouter(req, res, next);
});
app.use('/api/jobs', jobRouter);

// Application routes with submission rate limit
const applicationRouter = applicationRoutes(supabase);
app.post('/api/applications', applicationLimiter, (req, res, next) => {
  applicationRouter(req, res, next);
});
app.use('/api/applications', applicationRouter);

// Notification routes with invitation rate limit
const notificationRouter = notificationRoutes(supabase);
app.post('/api/notifications/invite', notificationLimiter, (req, res, next) => {
  notificationRouter(req, res, next);
});
app.use('/api/notifications', notificationRouter);

// Profile routes with update rate limit
const profileRouter = profileRoutes(supabase);
app.post('/api/profiles', profileUpdateLimiter, (req, res, next) => {
  profileRouter(req, res, next);
});
app.use('/api/profiles', profileRouter);

// Other routes (no additional rate limits)
app.use('/api/saved-jobs', savedJobsRoutes(supabase));
app.use('/api/admin', adminRoutes(supabase));

// ======================
// HEALTH CHECK & ERROR HANDLING
// ======================

// Health check route (no rate limit)
app.get('/', (req, res) => {
  res.json({
    message: 'Job Board API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔒 Security: Helmet enabled`);
  console.log(`🛡️  Rate limiting: Active`);
  console.log(`🌐 CORS: Configured`);
});