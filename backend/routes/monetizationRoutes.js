// ============================================
// MONETIZATION ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken: protect } = require('../middleware/auth');
const paymobService = require('../utils/paymobService');

// ==========================================
// SUBSCRIPTION ROUTES (Job Seekers)
// ==========================================

/**
 * GET /api/monetization/subscription/plans
 * Get available subscription plans
 */
router.get('/subscription/plans', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM subscription_plans WHERE user_type = $1 AND is_active = true ORDER BY price_egp ASC',
            ['job_seeker']
        );

        res.json({
            success: true,
            plans: result.rows
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

/**
 * GET /api/monetization/subscription/status
 * Get current user's subscription status
 */
router.get('/subscription/status', protect, async (req, res) => {
    try {
        // userId is UUID
        const result = await pool.query(
            `SELECT subscription_tier, subscription_expires_at, applications_used_today, last_application_reset
       FROM users WHERE id = $1::uuid`,
            [req.user.userId]
        );

        const user = result.rows[0];

        // Check if subscription expired
        if (user.subscription_tier === 'premium' && user.subscription_expires_at) {
            const now = new Date();
            const expiresAt = new Date(user.subscription_expires_at);

            if (expiresAt < now) {
                // Subscription expired, downgrade to free
                await pool.query(
                    'UPDATE users SET subscription_tier = $1 WHERE id = $2',
                    ['free', req.user.userId]
                );
                user.subscription_tier = 'free';
            }
        }

        // Calculate applications remaining today
        const dailyLimit = user.subscription_tier === 'premium' ? 40 : 10;
        const applicationsRemaining = Math.max(0, dailyLimit - user.applications_used_today);

        res.json({
            success: true,
            subscription: {
                tier: user.subscription_tier,
                expiresAt: user.subscription_expires_at,
                applicationsUsedToday: user.applications_used_today,
                applicationsRemaining,
                dailyLimit
            }
        });
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
});

/**
 * POST /api/monetization/subscription/purchase
 * Initialize subscription purchase
 */
router.post('/subscription/purchase', protect, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { planId } = req.body;

        // Check if user is job seeker (userId is UUID)
        const userResult = await pool.query('SELECT user_type, subscription_tier FROM users WHERE id = $1::uuid', [userId]);
        const user = userResult.rows[0];

        if (user.user_type !== 'job_seeker') {
            return res.status(400).json({ error: 'Only job seekers can purchase subscriptions' });
        }

        // Get plan details
        const planResult = await pool.query('SELECT * FROM subscription_plans WHERE id = $1::uuid', [planId]);
        if (planResult.rows.length === 0) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const plan = planResult.rows[0];

        // Determine if this is first-time purchase (user was never premium)
        const hasBeenPremium = user.subscription_tier === 'premium' || await checkIfWasPremiumBefore(userId);
        const price = hasBeenPremium ? plan.price_egp : (plan.first_time_price_egp || plan.price_egp);

        // Create pending payment record
        const paymentResult = await pool.query(
            `INSERT INTO payments (user_id, transaction_type, plan_id, amount_egp, status, metadata)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6) RETURNING id`,
            [
                userId,
                'subscription',
                planId,
                price,
                'pending',
                JSON.stringify({ duration_months: plan.duration_months, is_first_time: !hasBeenPremium })
            ]
        );

        const paymentId = paymentResult.rows[0].id;

        // Get user details for Paymob
        const userDetails = await pool.query(
            'SELECT email, full_name, phone FROM users WHERE id = $1::uuid',
            [userId]
        );

        // Initialize payment with Paymob
        const paymentData = await paymobService.initializePayment(
            userDetails.rows[0],
            parseFloat(price),
            {
                type: 'subscription',
                planId,
                paymentId,
                userId
            }
        );

        if (!paymentData.success) {
            // Update payment as failed
            await pool.query('UPDATE payments SET status = $1 WHERE id = $2', ['failed', paymentId]);
            return res.status(500).json({ error: 'Failed to initialize payment' });
        }

        // Update payment with Paymob details
        await pool.query(
            'UPDATE payments SET paymob_order_id = $1 WHERE id = $2',
            [paymentData.orderId, paymentId]
        );

        res.json({
            success: true,
            payment: {
                id: paymentId,
                iframeUrl: paymentData.iframeUrl,
                amount: price,
                plan: {
                    name: plan.name,
                    durationMonths: plan.duration_months
                }
            }
        });

    } catch (error) {
        console.error('Error initiating subscription purchase:', error);
        res.status(500).json({ error: 'Failed to initialize subscription purchase' });
    }
});

// ==========================================
// CREDIT ROUTES (Recruiters)
// ==========================================

/**
 * GET /api/monetization/credits/packages
 * Get available credit packages
 */
router.get('/credits/packages', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM credit_packages WHERE is_active = true ORDER BY credits ASC'
        );

        res.json({
            success: true,
            packages: result.rows
        });
    } catch (error) {
        console.error('Error fetching credit packages:', error);
        res.status(500).json({ error: 'Failed to fetch credit packages' });
    }
});

/**
 * GET /api/monetization/credits/balance
 * Get current user's credit balance
 */
router.get('/credits/balance', protect, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT credits, total_credits_purchased, first_credit_purchase FROM users WHERE id = $1::uuid',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            credits: {
                balance: user.credits,
                totalPurchased: user.total_credits_purchased,
                isFirstPurchase: !user.first_credit_purchase
            }
        });
    } catch (error) {
        console.error('Error fetching credit balance:', error);
        res.status(500).json({ error: 'Failed to fetch credit balance' });
    }
});

/**
 * POST /api/monetization/credits/purchase
 * Initialize credit purchase
 */
router.post('/credits/purchase', protect, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { packageId } = req.body;

        // Check if user is recruiter
        const userResult = await pool.query(
            'SELECT user_type, credits, first_credit_purchase FROM users WHERE id = $1::uuid',
            [userId]
        );
        const user = userResult.rows[0];

        if (user.user_type !== 'recruiter') {
            return res.status(400).json({ error: 'Only recruiters can purchase credits' });
        }

        // Get package details
        const packageResult = await pool.query('SELECT * FROM credit_packages WHERE id = $1::uuid', [packageId]);
        if (packageResult.rows.length === 0) {
            return res.status(404).json({ error: 'Package not found' });
        }

        const package = packageResult.rows[0];

        // Apply first-time discount if applicable
        const isFirstPurchase = !user.first_credit_purchase;
        const discount = isFirstPurchase ? package.first_purchase_discount : 0;
        const price = package.price_egp * (1 - discount);

        // Create pending payment record
        const paymentResult = await pool.query(
            `INSERT INTO payments (user_id, transaction_type, plan_id, amount_egp, credits, status, metadata)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7) RETURNING id`,
            [
                userId,
                'credits',
                packageId,
                price,
                package.credits,
                'pending',
                JSON.stringify({
                    original_price: package.price_egp,
                    discount_applied: discount,
                    is_first_purchase: isFirstPurchase
                })
            ]
        );

        const paymentId = paymentResult.rows[0].id;

        // Get user details for Paymob
        const userDetails = await pool.query(
            'SELECT email, full_name, phone FROM users WHERE id = $1::uuid',
            [userId]
        );

        // Initialize payment with Paymob
        const paymentData = await paymobService.initializePayment(
            userDetails.rows[0],
            parseFloat(price),
            {
                type: 'credits',
                packageId,
                paymentId,
                userId,
                credits: package.credits
            }
        );

        if (!paymentData.success) {
            await pool.query('UPDATE payments SET status = $1 WHERE id = $2', ['failed', paymentId]);
            return res.status(500).json({ error: 'Failed to initialize payment' });
        }

        // Update payment with Paymob details
        await pool.query(
            'UPDATE payments SET paymob_order_id = $1 WHERE id = $2',
            [paymentData.orderId, paymentId]
        );

        res.json({
            success: true,
            payment: {
                id: paymentId,
                iframeUrl: paymentData.iframeUrl,
                amount: price,
                originalPrice: package.price_egp,
                discount: discount * 100,
                package: {
                    name: package.name,
                    credits: package.credits
                }
            }
        });

    } catch (error) {
        console.error('Error initiating credit purchase:', error);
        res.status(500).json({ error: 'Failed to initialize credit purchase' });
    }
});

/**
 * GET /api/monetization/payment/:id/status
 * Check payment status (for polling after iframe close)
 */
router.get('/payment/:id/status', protect, async (req, res) => {
    try {
        const paymentId = req.params.id;
        const result = await pool.query(
            'SELECT status FROM payments WHERE id = $1::uuid AND user_id = $2::uuid',
            [paymentId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({ success: true, status: result.rows[0].status });
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});

// ==========================================
// PAYMOB WEBHOOK
// ==========================================

/**
 * POST /api/monetization/webhook/paymob
 * Handle Paymob payment callbacks
 */
router.post('/webhook/paymob', express.json(), async (req, res) => {
    try {
        const data = req.body;

        // Verify webhook signature
        const isValid = paymobService.verifyWebhookSignature(data);
        if (!isValid) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const { success, order, amount_cents, id: transactionId } = data;

        if (success && success === 'true') {
            // Extract payment ID from merchant order ID
            const merchantOrderId = order.merchant_order_id;
            const paymentId = parseInt(merchantOrderId.split('-')[2]); // Format: type-userId-paymentId

            // Get payment details
            const paymentResult = await pool.query('SELECT * FROM payments WHERE id = $1::uuid', [paymentId]);
            if (paymentResult.rows.length === 0) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            const payment = paymentResult.rows[0];

            // Update payment status
            await pool.query(
                'UPDATE payments SET status = $1, paymob_transaction_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                ['completed', transactionId, paymentId]
            );

            // Process based on transaction type
            if (payment.transaction_type === 'subscription') {
                await processSubscriptionPayment(payment);
            } else if (payment.transaction_type === 'credits') {
                await processCreditPayment(payment);
            }

            res.json({ success: true });
        } else {
            // Payment failed
            const merchantOrderId = order.merchant_order_id;
            const paymentId = parseInt(merchantOrderId.split('-')[2]);

            await pool.query(
                'UPDATE payments SET status = $1 WHERE id = $2',
                ['failed', paymentId]
            );

            res.json({ success: false });
        }

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function checkIfWasPremiumBefore(userId) {
    const result = await pool.query(
        'SELECT COUNT(*) as count FROM subscription_history WHERE user_id = $1',
        [userId]
    );
    return result.rows[0].count > 0;
}

async function processSubscriptionPayment(payment) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const metadata = payment.metadata;
        const durationMonths = metadata.duration_months;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // Update user subscription
        await client.query(
            `UPDATE users 
       SET subscription_tier = $1, subscription_expires_at = $2 
       WHERE id = $3`,
            ['premium', endDate, payment.user_id]
        );

        // Record subscription history
        await client.query(
            `INSERT INTO subscription_history (user_id, plan_id, start_date, end_date, is_renewal, payment_id)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6)`,
            [payment.user_id, payment.plan_id, startDate, endDate, !metadata.is_first_time, payment.id]
        );

        await client.query('COMMIT');
        console.log(`Subscription activated for user ${payment.user_id}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing subscription payment:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function processCreditPayment(payment) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get current credit balance
        const userResult = await client.query('SELECT credits FROM users WHERE id = $1::uuid', [payment.user_id]);
        const currentCredits = userResult.rows[0].credits;
        const newBalance = currentCredits + payment.credits;

        // Update user credits
        await client.query(
            `UPDATE users 
       SET credits = $1, 
           total_credits_purchased = total_credits_purchased + $2,
           first_credit_purchase = true
       WHERE id = $3`,
            [newBalance, payment.credits, payment.user_id]
        );

        // Record credit transaction
        await client.query(
            `INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, related_payment_id)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6)`,
            [
                payment.user_id,
                'purchase',
                payment.credits,
                newBalance,
                `Purchased ${payment.credits} credits`,
                payment.id
            ]
        );

        await client.query('COMMIT');
        console.log(`Credits added for user ${payment.user_id}: +${payment.credits} (balance: ${newBalance})`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing credit payment:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = router;
