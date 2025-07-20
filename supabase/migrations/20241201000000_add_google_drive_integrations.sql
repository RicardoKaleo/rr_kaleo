-- Add Google Drive Integrations table
CREATE TABLE google_drive_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  email_address TEXT NOT NULL,
  folder_id TEXT, -- The folder where resumes will be stored
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- Add unique constraint for upsert operations
);

-- Add index for performance
CREATE INDEX idx_google_drive_integrations_user_id ON google_drive_integrations(user_id);

-- Enable RLS
ALTER TABLE google_drive_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own drive integrations" ON google_drive_integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own drive integrations" ON google_drive_integrations
  FOR ALL USING (user_id = auth.uid()); 