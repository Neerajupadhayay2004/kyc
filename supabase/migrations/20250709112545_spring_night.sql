/*
  # Complete KYC System Database Schema

  1. New Tables
    - `users` - User authentication and basic info
    - `kyc_applications` - Main KYC application data
    - `kyc_documents` - Document storage and metadata
    - `kyc_facial_data` - Facial verification results
    - `kyc_audit_logs` - Security audit trail
    - `admin_users` - Admin dashboard access
    - `system_settings` - Application configuration

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - Implement audit logging
    - Secure file storage policies

  3. Features
    - Multi-step KYC process
    - Document verification
    - Facial recognition data
    - Risk assessment
    - Admin oversight
    - Compliance tracking
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- KYC Applications table
CREATE TABLE IF NOT EXISTS kyc_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  application_number text UNIQUE NOT NULL DEFAULT 'KYC-' || extract(epoch from now())::text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired')),
  current_step integer DEFAULT 1,
  
  -- Personal Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date NOT NULL,
  nationality text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  postal_code text NOT NULL,
  
  -- Risk Assessment
  risk_score decimal(3,2) DEFAULT 0.00,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Timestamps
  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Admin fields
  reviewed_by uuid REFERENCES users(id),
  rejection_reason text,
  admin_notes text
);

-- Documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES kyc_applications(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'driver_license', 'national_id')),
  document_number text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date NOT NULL,
  issuing_authority text NOT NULL,
  
  -- File storage
  front_image_url text,
  back_image_url text,
  front_image_path text,
  back_image_path text,
  
  -- Verification status
  is_verified boolean DEFAULT false,
  verification_score decimal(3,2),
  verification_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Facial verification data
CREATE TABLE IF NOT EXISTS kyc_facial_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES kyc_applications(id) ON DELETE CASCADE,
  
  -- Verification results
  is_completed boolean DEFAULT false,
  confidence_score decimal(3,2) DEFAULT 0.00,
  match_score decimal(3,2) DEFAULT 0.00,
  liveness_check boolean DEFAULT false,
  
  -- Image data
  facial_image_url text,
  facial_image_path text,
  
  -- Verification metadata
  verification_timestamp timestamptz,
  verification_method text DEFAULT 'camera',
  device_info jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs for security tracking
CREATE TABLE IF NOT EXISTS kyc_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  application_id uuid REFERENCES kyc_applications(id),
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'reviewer' CHECK (role IN ('admin', 'reviewer', 'auditor')),
  permissions jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_facial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for KYC applications
CREATE POLICY "Users can read own applications" ON kyc_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own applications" ON kyc_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft applications" ON kyc_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Admins can read all applications" ON kyc_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN users u ON au.user_id = u.id 
      WHERE u.id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Admins can update applications" ON kyc_applications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN users u ON au.user_id = u.id 
      WHERE u.id = auth.uid() AND au.is_active = true
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can read own documents" ON kyc_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kyc_applications ka 
      WHERE ka.id = application_id AND ka.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for own applications" ON kyc_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kyc_applications ka 
      WHERE ka.id = application_id AND ka.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all documents" ON kyc_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN users u ON au.user_id = u.id 
      WHERE u.id = auth.uid() AND au.is_active = true
    )
  );

-- RLS Policies for facial data
CREATE POLICY "Users can read own facial data" ON kyc_facial_data
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kyc_applications ka 
      WHERE ka.id = application_id AND ka.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create facial data for own applications" ON kyc_facial_data
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kyc_applications ka 
      WHERE ka.id = application_id AND ka.user_id = auth.uid()
    )
  );

-- RLS Policies for audit logs
CREATE POLICY "Admins can read audit logs" ON kyc_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN users u ON au.user_id = u.id 
      WHERE u.id = auth.uid() AND au.is_active = true AND au.role IN ('admin', 'auditor')
    )
  );

CREATE POLICY "System can create audit logs" ON kyc_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS Policies for admin users
CREATE POLICY "Admins can read admin data" ON admin_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN users u ON au.user_id = u.id 
      WHERE u.id = auth.uid() AND au.is_active = true AND au.role = 'admin'
    )
  );

-- RLS Policies for system settings
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN users u ON au.user_id = u.id 
      WHERE u.id = auth.uid() AND au.is_active = true AND au.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kyc_applications_user_id ON kyc_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_status ON kyc_applications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_created_at ON kyc_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_application_id ON kyc_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_kyc_facial_data_application_id ON kyc_facial_data(application_id);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_logs_user_id ON kyc_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_logs_created_at ON kyc_audit_logs(created_at);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('max_file_size', '5242880', 'Maximum file size for document uploads (5MB)'),
('allowed_file_types', '["image/jpeg", "image/png", "image/jpg"]', 'Allowed file types for document uploads'),
('kyc_expiry_days', '365', 'Number of days before KYC expires'),
('max_retry_attempts', '3', 'Maximum retry attempts for verification'),
('risk_score_threshold', '0.7', 'Risk score threshold for automatic approval')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_applications_updated_at BEFORE UPDATE ON kyc_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON kyc_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_facial_data_updated_at BEFORE UPDATE ON kyc_facial_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();