-- Replace 'your_database_name' with the actual database name
-- Drop the existing database if it exists
DROP DATABASE IF EXISTS your_database_name;

-- Create a new database
CREATE DATABASE your_database_name;

-- Connect to the new database
\c your_database_name

-- Run the schema creation script
\i database/src/schema/006_create_system_schema.sql

-- Run the seed data script
\i database/src/seed/007_seed_sample_data.sql
