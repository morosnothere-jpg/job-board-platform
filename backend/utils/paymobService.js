// ============================================
// PAYMOB INTEGRATION SERVICE
// ============================================

const axios = require('axios');
const crypto = require('crypto');

class PaymobService {
    constructor() {
        this.apiKey = process.env.PAYMOB_API_KEY;
        this.integrationId = process.env.PAYMOB_INTEGRATION_ID;
        this.iframeId = process.env.PAYMOB_IFRAME_ID;
        this.hmacSecret = process.env.PAYMOB_HMAC_SECRET;
        this.baseUrl = 'https://accept.paymob.com/api';

        // Integration IDs for different payment methods
        this.walletIntegrationId = process.env.PAYMOB_WALLET_INTEGRATION_ID;
        this.cardIntegrationId = process.env.PAYMOB_CARD_INTEGRATION_ID;
    }

    /**
     * Step 1: Authenticate and get auth token
     */
    async authenticate() {
        try {
            const response = await axios.post(`${this.baseUrl}/auth/tokens`, {
                api_key: this.apiKey
            });
            return response.data.token;
        } catch (error) {
            console.error('Paymob authentication error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Paymob');
        }
    }

    /**
     * Step 2: Register order with Paymob
     */
    async registerOrder(authToken, amountCents, orderId) {
        try {
            const response = await axios.post(`${this.baseUrl}/ecommerce/orders`, {
                auth_token: authToken,
                delivery_needed: false,
                amount_cents: amountCents, // Amount in cents (e.g., 100 EGP = 10000 cents)
                currency: 'EGP',
                merchant_order_id: orderId, // Your internal order ID
                items: []
            });
            return response.data;
        } catch (error) {
            console.error('Paymob order registration error:', error.response?.data || error.message);
            throw new Error('Failed to register order with Paymob');
        }
    }

    /**
     * Step 3: Get payment key for checkout
     */
    async getPaymentKey(authToken, order, billingData, amountCents) {
        try {
            const response = await axios.post(`${this.baseUrl}/acceptance/payment_keys`, {
                auth_token: authToken,
                amount_cents: amountCents,
                expiration: 3600, // 1 hour
                order_id: order.id,
                billing_data: billingData,
                currency: 'EGP',
                integration_id: this.integrationId
            });
            return response.data.token;
        } catch (error) {
            console.error('Paymob payment key error:', error.response?.data || error.message);
            throw new Error('Failed to get payment key from Paymob');
        }
    }

    /**
     * Main function: Initialize payment and get checkout URL
     */
    async initializePayment(user, amountEGP, orderData) {
        try {
            // Convert amount to cents
            const amountCents = Math.round(amountEGP * 100);

            // Generate unique order ID
            const orderId = `${orderData.type}-${user.id}-${Date.now()}`;

            // Step 1: Authenticate
            const authToken = await this.authenticate();

            // Step 2: Register order
            const order = await this.registerOrder(authToken, amountCents, orderId);

            // Step 3: Prepare billing data
            const billingData = {
                email: user.email,
                first_name: user.full_name.split(' ')[0] || 'User',
                last_name: user.full_name.split(' ').slice(1).join(' ') || 'User',
                phone_number: user.phone || '01000000000',
                apartment: 'NA',
                floor: 'NA',
                street: 'NA',
                building: 'NA',
                shipping_method: 'NA',
                postal_code: 'NA',
                city: 'NA',
                country: 'EG',
                state: 'NA'
            };

            // Step 4: Get payment key
            const paymentToken = await this.getPaymentKey(authToken, order, billingData, amountCents);

            // Step 5: Return iFrame URL
            const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`;

            return {
                success: true,
                iframeUrl,
                paymentToken,
                orderId: order.id,
                merchantOrderId: orderId,
                amount: amountEGP
            };

        } catch (error) {
            console.error('Payment initialization error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify webhook signature for security
     */
    verifyWebhookSignature(data) {
        try {
            const {
                amount_cents,
                created_at,
                currency,
                error_occured,
                has_parent_transaction,
                id,
                integration_id,
                is_3d_secure,
                is_auth,
                is_capture,
                is_refunded,
                is_standalone_payment,
                is_voided,
                order,
                owner,
                pending,
                source_data_pan,
                source_data_sub_type,
                source_data_type,
                success,
                hmac
            } = data;

            // Concatenate values in the exact order specified by Paymob
            const concatenatedString =
                `${amount_cents}` +
                `${created_at}` +
                `${currency}` +
                `${error_occured}` +
                `${has_parent_transaction}` +
                `${id}` +
                `${integration_id}` +
                `${is_3d_secure}` +
                `${is_auth}` +
                `${is_capture}` +
                `${is_refunded}` +
                `${is_standalone_payment}` +
                `${is_voided}` +
                `${order}` +
                `${owner}` +
                `${pending}` +
                `${source_data_pan}` +
                `${source_data_sub_type}` +
                `${source_data_type}` +
                `${success}`;

            // Calculate HMAC
            const calculatedHmac = crypto
                .createHmac('sha512', this.hmacSecret)
                .update(concatenatedString)
                .digest('hex');

            return calculatedHmac === hmac;
        } catch (error) {
            console.error('HMAC verification error:', error);
            return false;
        }
    }

    /**
     * Get mobile wallet payment URL (Vodafone Cash, Etisalat Cash, etc.)
     */
    async getWalletPaymentUrl(user, amountEGP, phoneNumber, orderData) {
        try {
            const amountCents = Math.round(amountEGP * 100);
            const orderId = `wallet-${user.id}-${Date.now()}`;

            const authToken = await this.authenticate();
            const order = await this.registerOrder(authToken, amountCents, orderId);

            const billingData = {
                email: user.email,
                first_name: user.full_name.split(' ')[0] || 'User',
                last_name: user.full_name.split(' ').slice(1).join(' ') || 'User',
                phone_number: phoneNumber,
                apartment: 'NA',
                floor: 'NA',
                street: 'NA',
                building: 'NA',
                shipping_method: 'NA',
                postal_code: 'NA',
                city: 'NA',
                country: 'EG',
                state: 'NA'
            };

            // Get payment key for wallet integration
            const response = await axios.post(`${this.baseUrl}/acceptance/payment_keys`, {
                auth_token: authToken,
                amount_cents: amountCents,
                expiration: 3600,
                order_id: order.id,
                billing_data: billingData,
                currency: 'EGP',
                integration_id: this.walletIntegrationId // Use wallet-specific integration ID
            });

            const paymentToken = response.data.token;

            // Return wallet payment URL
            const walletUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`;

            return {
                success: true,
                walletUrl,
                paymentToken,
                orderId: order.id,
                merchantOrderId: orderId
            };

        } catch (error) {
            console.error('Wallet payment error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new PaymobService();
