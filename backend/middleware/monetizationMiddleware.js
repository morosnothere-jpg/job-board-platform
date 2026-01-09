// ============================================
// MONETIZATION MIDDLEWARE
// ============================================

const pool = require('../config/database');

/**
 * Middleware to check if recruiter has enough credits to post a job
 */
const checkCreditsForJobPost = async (req, res, next) => {
    try {
        // Only apply to recruiters
        if (req.user.userType !== 'recruiter') {
            return next();
        }

        const CREDITS_PER_JOB_POST = 5;

        // userId is UUID string in Supabase
        const result = await pool.query(
            'SELECT credits FROM users WHERE id = $1::uuid',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentCredits = result.rows[0].credits;

        if (currentCredits < CREDITS_PER_JOB_POST) {
            return res.status(403).json({
                error: 'Insufficient credits',
                message: `You need ${CREDITS_PER_JOB_POST} credits to post a job. Current balance: ${currentCredits}`,
                required: CREDITS_PER_JOB_POST,
                current: currentCredits,
                needToPurchase: true
            });
        }

        // Store in request for later deduction
        req.creditCost = CREDITS_PER_JOB_POST;
        next();

    } catch (error) {
        console.error('Error checking credits:', error);
        res.status(500).json({ error: 'Failed to verify credits' });
    }
};

/**
 * Middleware to deduct credits after successful job post
 */
const deductCreditsForJobPost = async (jobId, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const CREDITS_PER_JOB_POST = 5;

        // Get current balance (userId is UUID string)
        const userResult = await client.query('SELECT credits FROM users WHERE id = $1::uuid', [userId]);
        const currentCredits = userResult.rows[0].credits;
        const newBalance = currentCredits - CREDITS_PER_JOB_POST;

        // Deduct credits (userId is UUID)
        await client.query(
            'UPDATE users SET credits = $1 WHERE id = $2::uuid',
            [newBalance, userId]
        );

        // Record transaction (userId is UUID)
        await client.query(
            `INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
       VALUES ($1::uuid, $2, $3, $4, $5)`,
            [userId, 'spend', -CREDITS_PER_JOB_POST, newBalance, `Posted job #${jobId}`]
        );

        await client.query('COMMIT');
        console.log(`Credits deducted for user ${userId}: -${CREDITS_PER_JOB_POST} (balance: ${newBalance})`);

        return { success: true, newBalance };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deducting credits:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Middleware to check daily application limit for job seekers
 */
const checkApplicationLimit = async (req, res, next) => {
    try {
        // Only apply to job seekers
        if (req.user.userType !== 'job_seeker') {
            return next();
        }

        const userId = req.user.userId;

        // Get user subscription and application count (userId is UUID)
        const result = await pool.query(
            `SELECT subscription_tier, subscription_expires_at, applications_used_today, 
              last_application_reset
       FROM users WHERE id = $1::uuid`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Check if subscription expired
        let subscriptionTier = user.subscription_tier;
        if (subscriptionTier === 'premium' && user.subscription_expires_at) {
            const now = new Date();
            const expiresAt = new Date(user.subscription_expires_at);

            if (expiresAt < now) {
                subscriptionTier = 'free';
                await pool.query('UPDATE users SET subscription_tier = $1 WHERE id = $2::uuid', ['free', userId]);
            }
        }

        // Reset counter if new day
        const lastReset = new Date(user.last_application_reset);
        const now = new Date();
        const isNewDay = lastReset.toDateString() !== now.toDateString();

        let applicationsUsedToday = user.applications_used_today;
        if (isNewDay) {
            applicationsUsedToday = 0;
            await pool.query(
                'UPDATE users SET applications_used_today = 0, last_application_reset = CURRENT_TIMESTAMP WHERE id = $1::uuid',
                [userId]
            );
        }

        // Check daily limit
        const dailyLimit = subscriptionTier === 'premium' ? 40 : 10;

        if (applicationsUsedToday >= dailyLimit) {
            return res.status(403).json({
                error: 'Daily application limit reached',
                message: subscriptionTier === 'premium'
                    ? 'You have reached your daily limit of 40 applications. Please try again tomorrow.'
                    : 'You have reached your daily limit of 10 applications. Upgrade to Premium for 40 applications per day!',
                dailyLimit,
                used: applicationsUsedToday,
                tier: subscriptionTier,
                needsUpgrade: subscriptionTier === 'free'
            });
        }

        // Attach info to request
        req.applicationInfo = {
            tier: subscriptionTier,
            used: applicationsUsedToday,
            limit: dailyLimit
        };

        next();

    } catch (error) {
        console.error('Error checking application limit:', error);
        res.status(500).json({ error: 'Failed to verify application limit' });
    }
};

/**
 * Increment application counter after successful application
 */
const incrementApplicationCount = async (userId) => {
    try {
        // userId is UUID
        await pool.query(
            'UPDATE users SET applications_used_today = applications_used_today + 1 WHERE id = $1::uuid',
            [userId]
        );

        // Also record in application_history (userId is UUID)
        await pool.query(
            `INSERT INTO application_history (user_id, job_id, application_date, subscription_tier)
       SELECT $1::uuid, $2, CURRENT_DATE, subscription_tier FROM users WHERE id = $1::uuid`,
            [userId, null] // job_id will be updated in the main application route
        );

        console.log(`Application count incremented for user ${userId}`);
    } catch (error) {
        console.error('Error incrementing application count:', error);
    }
};

/**
 * Middleware to check if recruiter can access candidate search
 * (Only available if credits > 0)
 */
const checkCandidateSearchAccess = async (req, res, next) => {
    try {
        if (req.user.userType !== 'recruiter') {
            return res.status(403).json({
                error: 'Only recruiters can search candidates'
            });
        }

        // userId is UUID
        const result = await pool.query(
            'SELECT credits FROM users WHERE id = $1::uuid',
            [req.user.userId]
        );

        const currentCredits = result.rows[0].credits;

        if (currentCredits <= 0) {
            return res.status(403).json({
                error: 'Candidate search unavailable',
                message: 'You need to purchase credits to access the candidate search feature.',
                needToPurchase: true
            });
        }

        next();
    } catch (error) {
        console.error('Error checking candidate search access:', error);
        res.status(500).json({ error: 'Failed to verify access' });
    }
};

module.exports = {
    checkCreditsForJobPost,
    deductCreditsForJobPost,
    checkApplicationLimit,
    incrementApplicationCount,
    checkCandidateSearchAccess
};
