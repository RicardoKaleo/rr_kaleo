-- Data Import Script
-- Run this script in your cloud Supabase SQL Editor
-- Make sure to import auth users first through the dashboard

-- Disable triggers during import to avoid conflicts
SET session_replication_role = replica;

-- Import table data (run each file's content in order)

-- Import user_profiles data
-- Copy and paste the content from user_profiles.sql here


-- Import clients data
-- Copy and paste the content from clients.sql here


-- Import client_managers data
-- Copy and paste the content from client_managers.sql here


-- Import client_final_users data
-- Copy and paste the content from client_final_users.sql here


-- Import clients_meta data
-- Copy and paste the content from clients_meta.sql here


-- Import recruiters data
-- Copy and paste the content from recruiters.sql here


-- Import job_listings data
-- Copy and paste the content from job_listings.sql here


-- Import job_recruiters data
-- Copy and paste the content from job_recruiters.sql here


-- Import gmail_integrations data
-- Copy and paste the content from gmail_integrations.sql here


-- Import google_drive_integrations data
-- Copy and paste the content from google_drive_integrations.sql here


-- Import email_templates data
-- Copy and paste the content from email_templates.sql here


-- Import email_campaigns data
-- Copy and paste the content from email_campaigns.sql here


-- Import email_campaign_followups data
-- Copy and paste the content from email_campaign_followups.sql here


-- Import gmail_watch_subscriptions data
-- Copy and paste the content from gmail_watch_subscriptions.sql here


-- Import gmail_history_tracking data
-- Copy and paste the content from gmail_history_tracking.sql here


-- Import data_access_logs data
-- Copy and paste the content from data_access_logs.sql here

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify data import
SELECT 'user_profiles' as table_name, count(*) as row_count FROM user_profiles
UNION ALL
SELECT 'clients', count(*) FROM clients
UNION ALL
SELECT 'job_listings', count(*) FROM job_listings
UNION ALL
SELECT 'recruiters', count(*) FROM recruiters
UNION ALL
SELECT 'email_templates', count(*) FROM email_templates;

