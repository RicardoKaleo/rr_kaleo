-- Gmail Push/Pull Notifications Database Extensions
-- Run this in your Supabase SQL Editor

-- Gmail Watch Subscriptions (tracks active watches per mailbox)
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

-- Reply Tracking (enhanced email_campaigns table)
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_detected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_content TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_sender TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_message_id TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS last_history_id TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmail_watch_subscriptions_integration ON gmail_watch_subscriptions(gmail_integration_id);
CREATE INDEX IF NOT EXISTS idx_gmail_watch_subscriptions_active ON gmail_watch_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_gmail_history_tracking_integration_history ON gmail_history_tracking(gmail_integration_id, history_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_thread_id ON email_campaigns(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_reply_status ON email_campaigns(reply_status);

-- RLS Policies for new tables
ALTER TABLE gmail_watch_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_history_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only users with access to the Gmail integration can view watch subscriptions
CREATE POLICY "Users can view their gmail watch subscriptions" ON gmail_watch_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gmail_integrations gi
      JOIN clients c ON gi.client_id = c.id
      JOIN client_managers cm ON c.id = cm.client_id
      WHERE gi.id = gmail_watch_subscriptions.gmail_integration_id 
      AND cm.manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM gmail_integrations gi
      JOIN clients c ON gi.client_id = c.id
      JOIN client_final_users cfu ON c.id = cfu.client_id
      WHERE gi.id = gmail_watch_subscriptions.gmail_integration_id 
      AND cfu.final_user_id = auth.uid()
    )
  );

-- RLS Policy: Only users with access to the Gmail integration can view history tracking
CREATE POLICY "Users can view their gmail history tracking" ON gmail_history_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gmail_integrations gi
      JOIN clients c ON gi.client_id = c.id
      JOIN client_managers cm ON c.id = cm.client_id
      WHERE gi.id = gmail_history_tracking.gmail_integration_id 
      AND cm.manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM gmail_integrations gi
      JOIN clients c ON gi.client_id = c.id
      JOIN client_final_users cfu ON c.id = cfu.client_id
      WHERE gi.id = gmail_history_tracking.gmail_integration_id 
      AND cfu.final_user_id = auth.uid()
    )
  );

-- Service role can insert/update (for webhook processing)
CREATE POLICY "Service role can manage gmail watch subscriptions" ON gmail_watch_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage gmail history tracking" ON gmail_history_tracking
  FOR ALL USING (auth.role() = 'service_role'); 