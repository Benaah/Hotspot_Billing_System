-- Sample seed data for users
INSERT INTO users (id, email, full_name, phone_number, role, is_active, password_hash, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'admin@example.com', 'Admin User', '254722111222', 'admin', TRUE, '$2b$10$6sV5n2Q/9C/oX0Q5ZuHbOuqYUOd0JZ6Zi9zX3yY3wZ2x1w0v9u8t7r6q5p4o3n2m1l0k9j8h7g6f5e4d3c2b1a0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'user1@example.com', 'User One', '254722111222', 'user', TRUE, '$2b$10$6sV5n2Q/9C/oX0Q5ZuHbOuqYUOd0JZ6Zi9zX3yY3wZ2x1w0v9u8t7r6q5p4o3n2m1l0k9j8h7g6f5e4d3c2b1a0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Login credentials:
-- admin@admin.com:admin123
-- user1@example.com:user123

-- Enhanced seed data for packages with realistic tiers
INSERT INTO packages (id, name, description, price, duration_hours, data_limit_mb, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Hourly Basic', '1 hour quick access package', 1.99, 1, 500, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Daily Light', '24-hour basic browsing', 4.99, 24, 1024, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Weekly Standard', '7-day regular usage package', 14.99, 168, 5120, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Monthly Pro', '30-day unlimited streaming package', 29.99, 720, 20480, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Business Premium', 'High-speed business package', 49.99, 720, 51200, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Additional users with various roles
INSERT INTO users (id, email, full_name, phone_number, role, is_active, password_hash, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'business@example.com', 'Business User', '1234567891', 'business', TRUE, 'hashedpassword3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'student@example.com', 'Student User', '1234567892', 'user', TRUE, 'hashedpassword4', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'support@example.com', 'Support Staff', '1234567893', 'support', TRUE, 'hashedpassword5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Common support tickets
INSERT INTO support_tickets (id, user_id, subject, description, status, created_at, updated_at)
SELECT gen_random_uuid(), u.id, subject, message, status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
CROSS JOIN (
        VALUES 
        ('Slow Connection', 'My internet speed is very slow', 'open'),
        ('Cannot Connect', 'Unable to connect to the network', 'in_progress'),
        ('Billing Question', 'Need clarification on my last bill', 'closed'),
        ('Package Upgrade', 'Want to upgrade my current package', 'open'),
        ('Login Issues', 'Cannot log into the portal', 'pending')
) AS tickets(subject, description, status)
WHERE u.role = 'user';

-- Add more varied subscriptions
INSERT INTO subscriptions (id, user_id, package_id, start_time, end_time, data_used_mb, status, created_at, updated_at)
SELECT gen_random_uuid(), u.id, p.id, 
        CURRENT_TIMESTAMP - INTERVAL '1 day' * FLOOR(RANDOM() * 30),
        CURRENT_TIMESTAMP + INTERVAL '1 hour' * p.duration_hours,
        FLOOR(RANDOM() * p.data_limit_mb),
        'active',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
FROM users u
CROSS JOIN packages p
WHERE u.role IN ('user', 'business');