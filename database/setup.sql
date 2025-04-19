CREATE DATABASE hotspot_billing;

\c hotspot_billing;

-- Create Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100),
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create Packages Table
CREATE TABLE packages (
    package_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    duration_hours INTEGER NOT NULL,
    bandwidth_mbps INTEGER NOT NULL,
    data_limit_mb INTEGER,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Subscriptions Table
CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    package_id INTEGER REFERENCES packages(package_id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    data_used_mb INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Transactions Table (Enhanced for M-Pesa)
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    subscription_id INTEGER REFERENCES subscriptions(subscription_id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'mpesa',
    mpesa_receipt_number VARCHAR(50) UNIQUE,
    merchant_request_id VARCHAR(50),
    checkout_request_id VARCHAR(50),
    phone_number VARCHAR(15) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('success', 'failed', 'pending')),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Usage Logs Table
CREATE TABLE usage_logs (
    log_id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(subscription_id),
    bytes_used BIGINT NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indices for better performance
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_packages_price ON packages(price);
CREATE INDEX idx_packages_is_active ON packages(is_active);
CREATE INDEX idx_packages_created_at ON packages(created_at);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_start_time ON subscriptions(start_time);
CREATE INDEX idx_subscriptions_end_time ON subscriptions(end_time);
CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_merchant_request ON transactions(merchant_request_id);
CREATE INDEX idx_transactions_checkout_request ON transactions(checkout_request_id);
CREATE INDEX idx_transactions_phone ON transactions(phone_number);

DROP INDEX IF EXISTS idx_transactions_mpesa_receipt;
DROP INDEX IF EXISTS idx_transactions_created_at;

CREATE INDEX idx_usage_logs_subscription_id ON usage_logs(subscription_id);
CREATE INDEX idx_usage_logs_logged_at ON usage_logs(logged_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();