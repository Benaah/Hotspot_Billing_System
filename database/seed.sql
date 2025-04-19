-- Seed Users with bcrypt hashed passwords
INSERT INTO users (username, password_hash, phone_number, email, full_name, is_admin, is_active) VALUES
('john_doe', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewражqQQPuEJHxS2i', '+254700123456', 'john@example.com', 'John Doe', false, true),
('jane_smith', '$2a$12$dNy0m1PZ.Ogq1Zh94TKFz.nFHNB8pvHxfZqwVGi3EZQzwUiBbQYbu', '+254711234567', 'jane@example.com', 'Jane Smith', false, true),
('bob_wilson', '$2a$12$k8K2pL9MXqrPI4TuFqvgpeGzth0UFXdgiRy2696hWgQWTKizp9pfe', '+254722345678', 'bob@example.com', 'Bob Wilson', false, true),
('admin_user', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqQQPuEJHxS2i', '+254733456789', 'admin@hotspot.com', 'System Admin', true, true);

-- Plain text passwords for reference (store these securely!):
-- john_doe: Password123!
-- jane_smith: SecurePass456!
-- bob_wilson: UserPass789!
-- admin_user: AdminPass2024!

-- Seed Packages with more realistic values
INSERT INTO packages (name, description, duration_hours, bandwidth_mbps, data_limit_mb, price, is_active) VALUES
('Quick Browse', '1 hour quick access package', 1, 10, 1000, 50.00, true),
('Daily Plus', '24 hour unlimited package', 24, 25, 5000, 100.00, true),
('Weekly Pro', '7 day high-speed package', 168, 50, 20000, 500.00, true),
('Monthly Ultra', '30 day premium package', 720, 100, 100000, 2000.00, true);

-- Seed Subscriptions with proper timestamps
INSERT INTO subscriptions (user_id, package_id, start_time, end_time, data_used_mb, status) VALUES
(1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 hour', 0, 'active'),
(2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours', 100, 'active'),
(3, 3, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP, 15000, 'expired');

-- Seed Transactions with M-Pesa details
INSERT INTO transactions (
    user_id, 
    subscription_id, 
    amount, 
    payment_method, 
    merchant_request_id,
    checkout_request_id,
    phone_number,
    status
) VALUES
(1, 1, 50.00, 'mpesa', 'MR000001', 'CR000001', '+254700123456', 'success'),
(2, 2, 100.00, 'mpesa', 'MR000002', 'CR000002', '+254711234567', 'success'),
(3, 3, 500.00, 'mpesa', 'MR000003', 'CR000003', '+254722345678', 'success');

-- Seed Usage Logs
INSERT INTO usage_logs (subscription_id, bytes_used, logged_at) VALUES
(1, 52428800, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),  -- 50 MB
(2, 104857600, CURRENT_TIMESTAMP - INTERVAL '12 hours'),   -- 100 MB
(3, 1073741824, CURRENT_TIMESTAMP - INTERVAL '3 days');    -- 1 GB