-- Sample Data for Reverse Recruiting Platform
-- This migration should run after the schema is created

-- First, ensure RLS is enabled but with a permissive policy for development
DO $$ 
BEGIN
    -- Only create the policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'Temporary permissive policy'
    ) THEN
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Temporary permissive policy" ON clients
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Create auth.users first
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'alex.thompson@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('a2222222-2222-2222-2222-222222222222', 'rachel.martinez@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('a3333333-3333-3333-3333-333333333333', 'thomas.wright@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated');

-- Let's create some sample managers first
INSERT INTO user_profiles (id, role, full_name)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'manager', 'Alex Thompson'),
  ('a2222222-2222-2222-2222-222222222222', 'manager', 'Rachel Martinez'),
  ('a3333333-3333-3333-3333-333333333333', 'manager', 'Thomas Wright');

-- First, let's create some sample clients
INSERT INTO clients (id, name, email, company, phone, linkedin_url, notes, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Smith', 'john.smith@techcorp.com', 'TechCorp', '+1-555-0101', 'https://linkedin.com/in/johnsmith', 'Senior developer with 10 years experience', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'sarah.j@innovatech.com', 'InnovaTech', '+1-555-0102', 'https://linkedin.com/in/sarahjohnson', 'Full-stack developer specializing in React', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Michael Chen', 'mchen@datawise.io', 'DataWise', '+1-555-0103', 'https://linkedin.com/in/michaelchen', 'Data scientist with ML expertise', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Emily Brown', 'emily.b@cloudnet.com', 'CloudNet', '+1-555-0104', 'https://linkedin.com/in/emilybrown', 'DevOps engineer, AWS certified', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'David Wilson', 'david.w@securetech.com', 'SecureTech', '+1-555-0105', 'https://linkedin.com/in/davidwilson', 'Security specialist with CISSP', 'prospect');

-- Now, let's create the clients_meta data with the correct schema
INSERT INTO clients_meta (
  client_id, gender, ethnicity, veteran_status, disability, 
  salary_expectations, notice_period, title_role, travel_percent,
  client_references, geographic_preferences, work_experience,
  work_preference, visa_status, observations
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Male',
    'Asian',
    'I am not a veteran',
    'I don''t have a disability',
    '$150,000 - $180,000',
    '2 weeks',
    'Senior Software Engineer',
    10,
    'Available upon request',
    'Remote preferred, open to San Francisco',
    '10 years in full-stack development',
    'Full Remote',
    'I''m a citizen',
    'Strong leadership experience, prefers backend work'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Female',
    'Asian',
    'I am not a veteran',
    'I don''t have a disability',
    '$130,000 - $160,000',
    '4 weeks',
    'Full Stack Developer',
    20,
    'Previous tech leads available as references',
    'San Francisco Bay Area',
    '5 years React, Node.js experience',
    'Hybrid',
    'I have a work permit',
    'Excellent front-end skills, seeking tech lead role'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Male',
    'Asian',
    'I am not a veteran',
    'I don''t have a disability',
    '$160,000 - $200,000',
    '1 month',
    'Senior Data Scientist',
    5,
    'PhD advisor and previous manager',
    'New York, Boston',
    '3 years post-PhD industry experience',
    'Hybrid',
    'I need to be sponsored for VISA',
    'Specialized in NLP and computer vision'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Female',
    'Black or African American',
    'I am not a veteran',
    'I don''t have a disability',
    '$140,000 - $170,000',
    '3 weeks',
    'DevOps Engineer',
    15,
    'Current manager and team lead',
    'Seattle, Portland',
    '6 years DevOps and cloud infrastructure',
    'Hybrid',
    'I''m a citizen',
    'Strong AWS expertise, Kubernetes certified'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Male',
    'Two or more races',
    'I am a protected veteran',
    'I don''t have a disability',
    '$170,000 - $200,000',
    '1 month',
    'Security Engineer',
    25,
    'Security clearance references available',
    'Washington DC area only',
    '8 years in cybersecurity',
    'On-Site',
    'I''m a citizen',
    'Active security clearance, CISSP certified'
  );

-- Now, let's create client-manager assignments
INSERT INTO client_managers (client_id, manager_id, notes)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Primary contact for TechCorp placement'),
  ('11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Supporting technical assessment'),
  ('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Handling React opportunities'),
  ('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'ML specialist placement'),
  ('44444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'DevOps placement focus'),
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 'Security clearance required'); 