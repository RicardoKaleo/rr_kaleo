-- Function to disconnect Gmail integration and clean up related data
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION disconnect_gmail_integration(integration_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete history tracking records
  DELETE FROM gmail_history_tracking 
  WHERE gmail_integration_id = integration_id;
  
  -- Delete watch subscription records
  DELETE FROM gmail_watch_subscriptions 
  WHERE gmail_integration_id = integration_id;
  
  -- Update email campaigns to remove Gmail integration reference
  -- Keep the campaigns but mark them as disconnected
  UPDATE email_campaigns 
  SET gmail_integration_id = NULL,
      status = CASE 
        WHEN status = 'sent' THEN 'sent'
        ELSE 'disconnected'
      END
  WHERE gmail_integration_id = integration_id;
  
  -- Finally, delete the Gmail integration record
  DELETE FROM gmail_integrations 
  WHERE id = integration_id;
  
  -- Log the disconnection
  INSERT INTO data_access_logs (
    action, 
    table_name, 
    record_id, 
    details
  ) VALUES (
    'disconnect_gmail_integration',
    'gmail_integrations',
    integration_id,
    jsonb_build_object('disconnected_at', now())
  );
  
END;
$$; 