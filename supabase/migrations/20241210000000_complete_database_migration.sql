-- Complete Database Migration
-- Generated for cloud migration - matches local database schema exactly
-- This replaces the incomplete production_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('manager', 'final_user'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE application_method AS ENUM ('email', 'linkedin', 'job_search_site', 'company_portal', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('active', 'paused', 'closed', 'applied', 'interview_scheduled', 'rejected', 'offer_received'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE gender_type AS ENUM ('Female', 'Male', 'Non-Binary'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ethnicity_type AS ENUM ('Asian', 'Black or African American', 'Hispanic or Latino', 'Native American or Native Alaska', 'Native Haiwaiian or other Pacific Islander', 'Two or more races'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE veteran_status_type AS ENUM ('I am a protected veteran', 'I am a veteran but not protected', 'I am not a veteran'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE disability_type AS ENUM ('I don''t have a disability', 'I have a disability'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE work_preference_type AS ENUM ('Full Remote', 'Hybrid', 'On-Site'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE visa_status_type AS ENUM ('I have a work permit', 'I need to be sponsored for VISA', 'I''m a citizen', 'Other (Comment to Specify)'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User Profiles (extends Supabase auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'final_user',
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients (note: using first_name/last_name not single name field)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  linkedin_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Assignments
CREATE TABLE IF NOT EXISTS client_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, manager_id)
);

CREATE TABLE IF NOT EXISTS client_final_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  final_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id),
  UNIQUE(final_user_id)
);

-- Clients Meta (Extended Profile Fields)
CREATE TABLE IF NOT EXISTS clients_meta (
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

-- Job Listings
CREATE TABLE IF NOT EXISTS job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary_range TEXT,
  job_url TEXT,
  description TEXT,
  application_method application_method NOT NULL,
  application_url TEXT,
  status job_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recruiters
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT,
  position TEXT,
  linkedin_url TEXT,
  phone TEXT,
  notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job-Recruiter Associations
CREATE TABLE IF NOT EXISTS job_recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES recruiters(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_listing_id, recruiter_id)
);

-- Gmail Integrations
CREATE TABLE IF NOT EXISTS gmail_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  email_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google Drive Integrations (User-based, not client-based)
CREATE TABLE IF NOT EXISTS google_drive_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  email_address TEXT NOT NULL,
  folder_id TEXT, -- The folder where resumes will be stored
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- Add unique constraint for upsert operations
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  gmail_integration_id UUID REFERENCES gmail_integrations(id),
  template_id UUID REFERENCES email_templates(id),
  custom_subject TEXT,
  custom_body TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  resume_file_url TEXT,
  thread_id TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  reply_status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'replied'
  reply_detected_at TIMESTAMP WITH TIME ZONE,
  reply_content TEXT,
  reply_sender TEXT,
  reply_message_id TEXT,
  last_history_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaign Followups
CREATE TABLE IF NOT EXISTS email_campaign_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    
    -- 2nd follow-up configuration
    second_followup_enabled BOOLEAN DEFAULT false,
    second_followup_template_id UUID REFERENCES email_templates(id),
    second_followup_days_after INTEGER DEFAULT 3,
    
    -- 3rd follow-up configuration
    third_followup_enabled BOOLEAN DEFAULT false,
    third_followup_template_id UUID REFERENCES email_templates(id),
    third_followup_days_after INTEGER DEFAULT 7,
    
    -- Status tracking
    second_followup_sent_at TIMESTAMP WITH TIME ZONE,
    third_followup_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gmail Watch Subscriptions
CREATE TABLE IF NOT EXISTS gmail_watch_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_integration_id UUID REFERENCES gmail_integrations(id) ON DELETE CASCADE,
  history_id TEXT NOT NULL,
  expiration_time TIMESTAMP WITH TIME ZONE NOT NULL,
  topic_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gmail_integration_id)
);

-- Gmail History Tracking (stores processed history IDs)
CREATE TABLE IF NOT EXISTS gmail_history_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_integration_id UUID REFERENCES gmail_integrations(id) ON DELETE CASCADE,
  history_id TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gmail_integration_id, history_id)
);

-- Data Access Logs
CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_meta_client_id ON clients_meta(client_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_client_id ON job_listings(client_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_recruiters_email ON recruiters(email);
CREATE INDEX IF NOT EXISTS idx_client_managers_client_id ON client_managers(client_id);
CREATE INDEX IF NOT EXISTS idx_client_managers_manager_id ON client_managers(manager_id);
CREATE INDEX IF NOT EXISTS idx_client_final_users_client_id ON client_final_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_final_users_final_user_id ON client_final_users(final_user_id);
CREATE INDEX IF NOT EXISTS idx_google_drive_integrations_user_id ON google_drive_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_watch_subscriptions_integration ON gmail_watch_subscriptions(gmail_integration_id);
CREATE INDEX IF NOT EXISTS idx_gmail_watch_subscriptions_active ON gmail_watch_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_gmail_history_tracking_integration_history ON gmail_history_tracking(gmail_integration_id, history_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_thread_id ON email_campaigns(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_reply_status ON email_campaigns(reply_status);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created_at ON data_access_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_final_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_watch_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_history_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- User Profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients: Managers can see assigned clients, final users can see their single assigned client
CREATE POLICY "Managers can view assigned clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_managers 
      WHERE client_id = clients.id 
      AND manager_id = auth.uid()
    )
  );

CREATE POLICY "Final users can view assigned client" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_final_users 
      WHERE client_id = clients.id 
      AND final_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage assigned clients" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM client_managers 
      WHERE client_id = clients.id 
      AND manager_id = auth.uid()
    )
  );

-- Client Meta policies
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

-- Job Listings: Based on client assignments
CREATE POLICY "Users can view job listings for assigned clients" ON job_listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_managers 
      WHERE client_id = job_listings.client_id 
      AND manager_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM client_final_users 
      WHERE client_id = job_listings.client_id 
      AND final_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage job listings for assigned clients" ON job_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM client_managers 
      WHERE client_id = job_listings.client_id 
      AND manager_id = auth.uid()
    )
  );

-- Recruiters: All authenticated users can view, managers can manage
CREATE POLICY "Authenticated users can view recruiters" ON recruiters
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage recruiters" ON recruiters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'manager'
    )
  );

-- Email Templates: Users can only see their own templates
CREATE POLICY "Users can view own templates" ON email_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own templates" ON email_templates
  FOR ALL USING (user_id = auth.uid());

-- Google Drive Integrations: Users can only see their own integrations
CREATE POLICY "Users can view own drive integrations" ON google_drive_integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own drive integrations" ON google_drive_integrations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can insert own drive integrations" ON google_drive_integrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Data Access Logs: Only system can insert, users can view their own logs
CREATE POLICY "Users can view own logs" ON data_access_logs
  FOR SELECT USING (user_id = auth.uid());

-- Gmail Integrations: Based on client assignments
CREATE POLICY "Users can view gmail integrations for assigned clients" ON gmail_integrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_managers cm
      JOIN clients c ON c.id = cm.client_id
      WHERE c.id = gmail_integrations.client_id 
      AND cm.manager_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM client_final_users cfu
      JOIN clients c ON c.id = cfu.client_id
      WHERE c.id = gmail_integrations.client_id 
      AND cfu.final_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage gmail integrations for assigned clients" ON gmail_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM client_managers cm
      JOIN clients c ON c.id = cm.client_id
      WHERE c.id = gmail_integrations.client_id 
      AND cm.manager_id = auth.uid()
    )
  );

-- Email Campaigns: Based on job listing client assignments
CREATE POLICY "Users can view email campaigns for assigned clients" ON email_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      JOIN client_managers cm ON cm.client_id = jl.client_id
      WHERE jl.id = email_campaigns.job_listing_id 
      AND cm.manager_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM job_listings jl
      JOIN client_final_users cfu ON cfu.client_id = jl.client_id
      WHERE jl.id = email_campaigns.job_listing_id 
      AND cfu.final_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage email campaigns for assigned clients" ON email_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      JOIN client_managers cm ON cm.client_id = jl.client_id
      WHERE jl.id = email_campaigns.job_listing_id 
      AND cm.manager_id = auth.uid()
    )
  );

-- Add policies for remaining tables with basic authenticated access
CREATE POLICY "Authenticated users can access" ON client_managers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access" ON client_final_users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access" ON job_recruiters FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access" ON email_campaign_followups FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access" ON gmail_watch_subscriptions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access" ON gmail_history_tracking FOR ALL USING (auth.role() = 'authenticated');

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_meta_updated_at BEFORE UPDATE ON clients_meta FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_listings_updated_at BEFORE UPDATE ON job_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recruiters_updated_at BEFORE UPDATE ON recruiters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_google_drive_integrations_updated_at BEFORE UPDATE ON google_drive_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaign_followups_updated_at BEFORE UPDATE ON email_campaign_followups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gmail_watch_subscriptions_updated_at BEFORE UPDATE ON gmail_watch_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 