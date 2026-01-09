const cron = require('node-cron');
const pool = require('../config/database');

/**
 * Initialize Cron Jobs
 */
const initCronJobs = () => {
    console.log('⏰ Initializing Cron Jobs...');

    // 1. Reset Daily Applications (Runs at midnight 00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily application reset...');
        try {
            await pool.query('SELECT reset_daily_applications()');
            console.log('✅ Daily application reset complete.');
        } catch (error) {
            console.error('❌ Error resetting daily applications:', error);
        }
    });

    // 2. Check Expired Subscriptions (Runs every hour)
    cron.schedule('0 * * * *', async () => {
        console.log('Running subscription expiration check...');
        try {
            await pool.query('SELECT check_expired_subscriptions()');
            console.log('✅ Subscription expiration check complete.');
        } catch (error) {
            console.error('❌ Error checking expired subscriptions:', error);
        }
    });

    console.log('✅ Cron Jobs scheduled:');
    console.log('   - Daily Application Reset (00:00)');
    console.log('   - Subscription Expiry Check (Hourly)');
};

module.exports = initCronJobs;
