-- ============================================
-- MONETIZATION SYSTEM - SUPABASE COMPATIBLE
-- All IDs are UUID to match your existing schema
-- ============================================

-- 1. Add columns to users table for subscriptions and credits
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS applications_used_today INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_application_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS credits INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credits_purchased INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_credit_purchase BOOLEAN DEFAULT false;

-- 2. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL, -- 'job_seeker' or 'recruiter'
  duration_months INT NOT NULL,
  price_egp DECIMAL(10,2) NOT NULL,
  first_time_price_egp DECIMAL(10,2) NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

-- Insert Job Seeker Plans
INSERT INTO subscription_plans (name, user_type, duration_months, price_egp, first_time_price_egp, features) VALUES
('Premium (First Time)', 'job_seeker', 3, 179, 149, '{"daily_applications": 40, "ads": false, "premium_badge": true, "priority_search": true}'),
('Premium (Renewal)', 'job_seeker', 3, 179, NULL, '{"daily_applications": 40, "ads": false, "premium_badge": true, "priority_search": true}')
ON CONFLICT DO NOTHING;

-- 3. Credit Packages Table
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name VARCHAR(50) NOT NULL,
  credits INT NOT NULL,
  price_egp DECIMAL(10,2) NOT NULL,
  first_purchase_discount DECIMAL(5,2) DEFAULT 0.20,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT credit_packages_pkey PRIMARY KEY (id)
);

-- Insert Credit Packages
INSERT INTO credit_packages (name, credits, price_egp) VALUES
('Trial', 50, 59),
('Starter', 100, 99),
('Pro', 200, 179)
ON CONFLICT DO NOTHING;

-- 4. Payment Transactions Table (ALL UUID)
CREATE TABLE IF NOT EXISTS payments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'subscription' or 'credits'
  plan_id UUID NULL, -- Reference to subscription_plans or credit_packages
  amount_egp DECIMAL(10,2) NOT NULL,
  credits INT NULL,
  payment_method VARCHAR(50),
  paymob_transaction_id VARCHAR(255),
  paymob_order_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Credit Transactions Table (ALL UUID)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'purchase', 'spend', 'bonus', 'refund'
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  description TEXT,
  related_payment_id UUID NULL,
  CONSTRAINT credit_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT credit_transactions_payment_id_fkey FOREIGN KEY (related_payment_id) REFERENCES payments(id)
);

-- 6. Application History Table (ALL UUID)
CREATE TABLE IF NOT EXISTS application_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL,
  job_id UUID NULL,
  application_date DATE DEFAULT CURRENT_DATE,
  subscription_tier VARCHAR(20),
  CONSTRAINT application_history_pkey PRIMARY KEY (id),
  CONSTRAINT application_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT application_history_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- 7. Subscription History Table (ALL UUID)
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_renewal BOOLEAN DEFAULT false,
  payment_id UUID NULL,
  CONSTRAINT subscription_history_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT subscription_history_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  CONSTRAINT subscription_history_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier, subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(credits);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_application_history_user_date ON application_history(user_id, application_date);

-- 9. Function to reset daily applications
CREATE OR REPLACE FUNCTION reset_daily_applications()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    applications_used_today = 0,
    last_application_reset = NOW()
  WHERE DATE(last_application_reset) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to check and update expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET subscription_tier = 'free'
  WHERE subscription_tier = 'premium'
    AND subscription_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 11. Give all recruiters 10 free credits (one-time setup)
UPDATE users 
SET credits = 10 
WHERE user_type = 'recruiter' 
  AND credits = 0
  AND total_credits_purchased = 0;

-- 12. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payments table
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
BEFORE UPDATE ON payments
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans for job seekers';
COMMENT ON TABLE credit_packages IS 'Defines credit packages for recruiters';
COMMENT ON TABLE payments IS 'Stores all payment transactions (subscriptions and credits)';
COMMENT ON TABLE credit_transactions IS 'Tracks all credit additions and deductions';
COMMENT ON TABLE application_history IS 'Tracks daily application usage for rate limiting';
COMMENT ON TABLE subscription_history IS 'Historical record of all subscriptions';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Monetization system tables created successfully! ✅';
  RAISE NOTICE 'New tables: subscription_plans, credit_packages, payments, credit_transactions, application_history, subscription_history';
  RAISE NOTICE 'All existing recruiters have been given 10 free credits!';
END $$;
