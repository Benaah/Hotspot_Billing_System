/*
  # Initial schema for Hotspot Billing System

  1. New Tables
    - `packages` - Stores network package information
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, not null)
      - `price` (numeric, not null)
      - `duration_hours` (integer, not null)
      - `data_limit_mb` (integer, null for unlimited)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
    
    - `subscriptions` - Stores user subscriptions to packages
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `package_id` (uuid, foreign key to packages)
      - `start_time` (timestamptz, not null)
      - `end_time` (timestamptz, not null)
      - `is_active` (boolean, default true)
      - `data_used_mb` (integer, default 0)
      - `created_at` (timestamptz, default now())
    
    - `transactions` - Stores payment transactions
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `subscription_id` (uuid, foreign key to subscriptions)
      - `amount` (numeric, not null)
      - `status` (text, not null)
      - `payment_method` (text, not null)
      - `created_at` (timestamptz, default now())
    
    - `users` - Stores user profile information
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, not null)
      - `full_name` (text)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
    - Add policies for admins to manage all data
*/

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  duration_hours integer NOT NULL,
  data_limit_mb integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text,
  phone_number text,
  password_hash text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  start_time timestamptz DEFAULT timezone('utc', now()),
  end_time timestamptz NOT NULL,
  data_used_mb integer DEFAULT 0,
  status text CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);

-- Create usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  data_used_mb integer NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for packages
CREATE POLICY "Anyone can view active packages" 
  ON packages 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage packages" 
  ON packages 
  FOR ALL 
  USING (auth.role() = 'admin');

-- Create policies for users
CREATE POLICY "Users can view their own profile" 
  ON users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" 
  ON users 
  FOR ALL 
  USING (auth.role() = 'admin');

CREATE POLICY "Users can update their own profile" 
  ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Insert user on signup" 
  ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" 
  ON subscriptions 
  FOR ALL 
  USING (auth.role() = 'admin');

CREATE POLICY "Users can create their own subscriptions" 
  ON subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
  ON subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for payments
CREATE POLICY "Users can view their own payments" 
  ON payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" 
  ON payments 
  FOR ALL 
  USING (auth.role() = 'admin');

CREATE POLICY "Users can create their own payments" 
  ON payments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policies for usage logs
CREATE POLICY "Users can view their own usage logs" 
  ON usage_logs 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM subscriptions WHERE id = usage_logs.subscription_id
    )
  );

CREATE POLICY "Admins can view all usage logs" 
  ON usage_logs 
  FOR ALL 
  USING (auth.role() = 'admin');

-- Create trigger to automatically insert user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample packages
INSERT INTO packages (name, description, price, duration_hours, data_limit_mb, is_active)
VALUES 
  ('Basic', 'Basic internet access for casual browsing', 5.99, 24, 500, true),
  ('Standard', 'Standard package for regular internet users', 9.99, 72, 2000, true),
  ('Premium', 'High-speed internet for streaming and downloads', 14.99, 168, 5000, true),
  ('Unlimited', 'Unlimited data for power users', 24.99, 168, NULL, true),
  ('Quick Access', 'Quick 1-hour access for urgent needs', 1.99, 1, 100, true);

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_hours: number;
  data_limit_mb: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  start_time: string;
  end_time: string;
  data_used_mb: number;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  subscription_id: string;
  data_used_mb: number;
  timestamp: string;
  updated_at: string;
}