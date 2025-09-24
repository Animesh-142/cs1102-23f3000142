-- Mental Health Aftercare System Database Initialization

-- Create database if it doesn't exist (this is handled by Docker environment)
-- CREATE DATABASE IF NOT EXISTS mental_health_aftercare;

-- Use the database
-- \c mental_health_aftercare;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create enum types
CREATE TYPE user_role AS ENUM ('provider', 'admin', 'family_member');
CREATE TYPE patient_gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE patient_status AS ENUM ('active', 'inactive', 'completed', 'transferred');
CREATE TYPE patient_risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE checklist_frequency AS ENUM ('daily', 'weekly', 'biweekly');
CREATE TYPE checklist_type AS ENUM ('daily', 'weekly', 'monthly', 'custom');
CREATE TYPE checklist_status AS ENUM ('pending', 'sent', 'partial', 'completed', 'overdue');
CREATE TYPE checklist_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE notification_type AS ENUM ('checklist', 'reminder', 'alert', 'info', 'system');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'cancelled');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE contact_method AS ENUM ('email', 'sms', 'both');

-- Create indexes for better performance
-- These will be created by Sequelize automatically, but we can add custom ones here if needed

-- Insert default data
-- This will be handled by seeders in the application

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to generate audit logs (if needed)
CREATE OR REPLACE FUNCTION log_data_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Audit log implementation can be added here
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
-- This is handled by the database connection configuration

COMMENT ON DATABASE mental_health_aftercare IS 'Mental Health Aftercare System - HIPAA Compliant Database';

-- Set up default configuration
ALTER DATABASE mental_health_aftercare SET timezone = 'UTC';
ALTER DATABASE mental_health_aftercare SET log_statement = 'all';
ALTER DATABASE mental_health_aftercare SET log_min_duration_statement = 1000;