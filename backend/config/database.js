const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool using the connection string from environment variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase/Heroku connections
    }
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('✅ Connected to PostgreSQL database');
    release();
});

module.exports = pool;
