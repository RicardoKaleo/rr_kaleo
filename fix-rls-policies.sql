-- Fix missing RLS policies for clients_meta table
-- These policies are needed for the upsert operation in the ClientMetaForm

-- Add INSERT policy for clients_meta
CREATE POLICY "Assigned users can insert client meta" ON clients_meta
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_managers WHERE client_id = clients_meta.client_id AND manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM client_final_users WHERE client_id = clients_meta.client_id AND final_user_id = auth.uid()
    )
  );

-- Add RLS policies for client_managers table (missing from schema)
CREATE POLICY "Users can view own manager assignments" ON client_managers
  FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "Users can view own final user assignments" ON client_final_users
  FOR SELECT USING (final_user_id = auth.uid());

-- Add RLS policies for other tables that might be missing
CREATE POLICY "Authenticated users can view recruiters" ON recruiters
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view job listings" ON job_listings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view job recruiters" ON job_recruiters
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own gmail integrations" ON gmail_integrations
  FOR SELECT USING (client_id IN (
    SELECT client_id FROM client_managers WHERE manager_id = auth.uid()
    UNION
    SELECT client_id FROM client_final_users WHERE final_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own gmail integrations" ON gmail_integrations
  FOR ALL USING (client_id IN (
    SELECT client_id FROM client_managers WHERE manager_id = auth.uid()
    UNION
    SELECT client_id FROM client_final_users WHERE final_user_id = auth.uid()
  ));

CREATE POLICY "Users can view own email templates" ON email_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own email templates" ON email_templates
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own email campaigns" ON email_campaigns
  FOR SELECT USING (job_listing_id IN (
    SELECT jl.id FROM job_listings jl
    JOIN client_managers cm ON jl.client_id = cm.client_id
    WHERE cm.manager_id = auth.uid()
    UNION
    SELECT jl.id FROM job_listings jl
    JOIN client_final_users cfu ON jl.client_id = cfu.client_id
    WHERE cfu.final_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own email campaigns" ON email_campaigns
  FOR ALL USING (job_listing_id IN (
    SELECT jl.id FROM job_listings jl
    JOIN client_managers cm ON jl.client_id = cm.client_id
    WHERE cm.manager_id = auth.uid()
  ));

CREATE POLICY "Users can view own email recipients" ON email_recipients
  FOR SELECT USING (campaign_id IN (
    SELECT ec.id FROM email_campaigns ec
    JOIN job_listings jl ON ec.job_listing_id = jl.id
    JOIN client_managers cm ON jl.client_id = cm.client_id
    WHERE cm.manager_id = auth.uid()
    UNION
    SELECT ec.id FROM email_campaigns ec
    JOIN job_listings jl ON ec.job_listing_id = jl.id
    JOIN client_final_users cfu ON jl.client_id = cfu.client_id
    WHERE cfu.final_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own email recipients" ON email_recipients
  FOR ALL USING (campaign_id IN (
    SELECT ec.id FROM email_campaigns ec
    JOIN job_listings jl ON ec.job_listing_id = jl.id
    JOIN client_managers cm ON jl.client_id = cm.client_id
    WHERE cm.manager_id = auth.uid()
  ));

CREATE POLICY "Users can view own data access logs" ON data_access_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert data access logs" ON data_access_logs
  FOR INSERT WITH CHECK (true); 