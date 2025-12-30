const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const savedJobsRoutes = require('./routes/savedJobsRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes(supabase));
app.use('/api/jobs', jobRoutes(supabase));
app.use('/api/applications', applicationRoutes(supabase));
app.use('/api/notifications', notificationRoutes(supabase));
app.use('/api/profiles', profileRoutes(supabase));
app.use('/api/saved-jobs', savedJobsRoutes(supabase));
app.use('/api/admin', adminRoutes(supabase));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Job Board API is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});