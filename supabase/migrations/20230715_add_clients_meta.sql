-- Migration: Combined schema for user_profiles, clients, clients_meta, and dependencies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('manager', 'final_user');
CREATE TYPE gender_type AS ENUM ('Female', 'Male', 'Non-Binary');
CREATE TYPE ethnicity_type AS ENUM ('Asian', 'Black or African American', 'Hispanic or Latino', 'Native American or Native Alaska', 'Native Haiwaiian or other Pacific Islander', 'Two or more races');
CREATE TYPE veteran_status_type AS ENUM ('I am a protected veteran', 'I am a veteran but not protected', 'I am not a veteran');
CREATE TYPE disability_type AS ENUM ('I don''t have a disability', 'I have a disability');
CREATE TYPE work_preference_type AS ENUM ('Full Remote', 'Hybrid', 'On-Site');
CREATE TYPE visa_status_type AS ENUM ('I have a work permit', 'I need to be sponsored for VISA', 'I''m a citizen', 'Other (Comment to Specify)');

-- User Profiles (extends Supabase auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'final_user',
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  linkedin_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients Meta (Extended Profile Fields)
CREATE TABLE clients_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  gender gender_type,
  ethnicity ethnicity_type,
  veteran_status veteran_status_type,
  disability disability_type,
  salary_expectations TEXT,
  notice_period TEXT,
  title_role TEXT,
  travel_percent NUMERIC,
  client_references TEXT,
  geographic_preferences TEXT,
  work_experience TEXT,
  work_preference work_preference_type,
  visa_status visa_status_type,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_meta_client_id ON clients_meta(client_id);

-- Enable Row Level Security (RLS) for clients_meta
ALTER TABLE clients_meta ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only managers/final users assigned to the client can view/edit meta
CREATE TABLE client_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, manager_id)
);

CREATE TABLE client_final_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  final_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id),
  UNIQUE(final_user_id)
);

CREATE POLICY "Assigned users can view client meta" ON clients_meta
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_managers WHERE client_id = clients_meta.client_id AND manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM client_final_users WHERE client_id = clients_meta.client_id AND final_user_id = auth.uid()
    )
  );

CREATE POLICY "Assigned users can update client meta" ON clients_meta
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM client_managers WHERE client_id = clients_meta.client_id AND manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM client_final_users WHERE client_id = clients_meta.client_id AND final_user_id = auth.uid()
    )
  );