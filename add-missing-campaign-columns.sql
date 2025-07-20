-- Add missing columns to email_campaigns table for reply tracking
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS reply_content TEXT,
ADD COLUMN IF NOT EXISTS reply_sender TEXT,
ADD COLUMN IF NOT EXISTS reply_message_id TEXT,
ADD COLUMN IF NOT EXISTS last_history_id TEXT;

-- Update existing campaigns to have a default recipient_email if null
UPDATE email_campaigns 
SET recipient_email = gmail_integrations.email_address
FROM gmail_integrations 
WHERE email_campaigns.gmail_integration_id = gmail_integrations.id 
AND email_campaigns.recipient_email IS NULL; 