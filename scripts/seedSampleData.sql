-- Insert admin user if not exists
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@admin.com')
BEGIN
  INSERT INTO users (id, email, full_name, role, created_at)
  VALUES (NEWID(), 'admin@admin.com', 'Admin User', 'admin', GETDATE());
END

-- Insert sample users if not exists
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'user1@example.com')
BEGIN
  INSERT INTO users (id, email, full_name, role, created_at)
  VALUES (NEWID(), 'user1@example.com', 'User One', 'user', GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'user2@example.com')
BEGIN
  INSERT INTO users (id, email, full_name, role, created_at)
  VALUES (NEWID(), 'user2@example.com', 'User Two', 'user', GETDATE());
END

-- Insert sample packages if not exists
IF NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Basic Package')
BEGIN
  INSERT INTO packages (id, name, price, description, created_at)
  VALUES (NEWID(), 'Basic Package', 9.99, 'Basic internet package', GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Premium Package')
BEGIN
  INSERT INTO packages (id, name, price, description, created_at)
  VALUES (NEWID(), 'Premium Package', 19.99, 'Premium internet package', GETDATE());
END

-- Insert sample subscription if not exists
IF NOT EXISTS (
  SELECT 1 FROM subscriptions s
  JOIN users u ON s.user_id = u.id
  JOIN packages p ON s.package_id = p.id
  WHERE u.email = 'user1@example.com' AND p.name = 'Basic Package'
)
BEGIN
  INSERT INTO subscriptions (id, user_id, package_id, start_date, end_date, status, created_at)
  SELECT NEWID(), u.id, p.id, GETDATE(), DATEADD(day, 30, GETDATE()), 'active', GETDATE()
  FROM users u, packages p
  WHERE u.email = 'user1@example.com' AND p.name = 'Basic Package';
END

-- Add more inserts as needed for your schema
