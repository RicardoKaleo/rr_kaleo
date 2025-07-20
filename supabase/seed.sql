-- Seed data for Reverse Recruiting SaaS Platform

-- Clear existing data (except user_profiles)
TRUNCATE TABLE client_final_users CASCADE;
TRUNCATE TABLE client_managers CASCADE;
TRUNCATE TABLE job_listings CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE recruiters CASCADE;
TRUNCATE TABLE job_recruiters CASCADE;
TRUNCATE TABLE email_templates CASCADE;

-- Insert sample clients (individual job seekers)
INSERT INTO clients (id, name, email, company, phone, linkedin_url, notes, status, created_at) VALUES
-- Technology Job Seekers
('550e8400-e29b-41d4-a716-446655440001', 'Alex Johnson', 'alex.johnson@email.com', 'TechCorp Inc', '+1-555-0101', 'https://linkedin.com/in/alexjohnson', 'Senior Full Stack Developer with 8 years experience in React, Node.js, and cloud technologies', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Sarah Chen', 'sarah.chen@email.com', 'DataViz Solutions', '+1-555-0102', 'https://linkedin.com/in/sarahchen', 'Data Scientist specializing in machine learning and Python with 6 years experience', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Michael Rodriguez', 'michael.rodriguez@email.com', 'CloudTech Systems', '+1-555-0103', 'https://linkedin.com/in/michaelrodriguez', 'DevOps Engineer with expertise in AWS, Docker, and Kubernetes', 'active', NOW()),

-- Healthcare Job Seekers
('550e8400-e29b-41d4-a716-446655440004', 'Dr. Emily Thompson', 'emily.thompson@email.com', 'HealthTech Innovations', '+1-555-0104', 'https://linkedin.com/in/emilythompson', 'Healthcare Software Engineer with medical background and 5 years in health tech', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'David Kim', 'david.kim@email.com', 'MediCare Systems', '+1-555-0105', 'https://linkedin.com/in/davidkim', 'Clinical Data Analyst with expertise in healthcare databases and compliance', 'active', NOW()),

-- Finance Job Seekers
('550e8400-e29b-41d4-a716-446655440006', 'Lisa Wang', 'lisa.wang@email.com', 'FinTech Dynamics', '+1-555-0106', 'https://linkedin.com/in/lisawang', 'Financial Software Engineer with 7 years experience in payment systems and fintech', 'active', NOW()),

-- E-commerce Job Seekers
('550e8400-e29b-41d4-a716-446655440007', 'James Wilson', 'james.wilson@email.com', 'ShopSmart Retail', '+1-555-0107', 'https://linkedin.com/in/jameswilson', 'E-commerce Developer with expertise in Shopify, WooCommerce, and custom platforms', 'active', NOW());

-- Insert client metadata (using clients_meta table)
INSERT INTO clients_meta (client_id, gender, ethnicity, veteran_status, disability, salary_expectations, notice_period, title_role, travel_percent, client_references, geographic_preferences, work_experience, work_preference, visa_status, observations) VALUES
-- Alex Johnson metadata
('550e8400-e29b-41d4-a716-446655440001', 'Male', 'Asian', 'I am not a veteran', 'I don''t have a disability', '$140,000 - $160,000', '2 weeks', 'Senior Full Stack Developer', 10, 'Available upon request', 'San Francisco, CA; Remote', '8 years in full-stack development, React, Node.js, AWS', 'Hybrid', 'I''m a citizen', 'Strong technical skills, excellent communication'),

-- Sarah Chen metadata
('550e8400-e29b-41d4-a716-446655440002', 'Female', 'Asian', 'I am not a veteran', 'I don''t have a disability', '$160,000 - $180,000', '1 month', 'Senior Data Scientist', 5, 'Available upon request', 'Austin, TX; Remote', '6 years in data science, machine learning, Python', 'Full Remote', 'I''m a citizen', 'Expert in ML algorithms and data visualization'),

-- Michael Rodriguez metadata
('550e8400-e29b-41d4-a716-446655440003', 'Male', 'Hispanic or Latino', 'I am not a veteran', 'I don''t have a disability', '$150,000 - $170,000', '2 weeks', 'Senior DevOps Engineer', 15, 'Available upon request', 'Seattle, WA; Remote', '5 years in DevOps, AWS, Kubernetes, Docker', 'Full Remote', 'I''m a citizen', 'Infrastructure automation expert'),

-- Dr. Emily Thompson metadata
('550e8400-e29b-41d4-a716-446655440004', 'Female', 'White', 'I am not a veteran', 'I don''t have a disability', '$130,000 - $150,000', '1 month', 'Healthcare Software Engineer', 20, 'Available upon request', 'Nashville, TN', '5 years in healthcare software, medical background', 'On-Site', 'I''m a citizen', 'Medical degree with software engineering experience'),

-- David Kim metadata
('550e8400-e29b-41d4-a716-446655440005', 'Male', 'Asian', 'I am not a veteran', 'I don''t have a disability', '$110,000 - $130,000', '2 weeks', 'Clinical Data Analyst', 10, 'Available upon request', 'Philadelphia, PA; Hybrid', '4 years in healthcare data analysis', 'Hybrid', 'I''m a citizen', 'Healthcare compliance expert'),

-- Lisa Wang metadata
('550e8400-e29b-41d4-a716-446655440006', 'Female', 'Asian', 'I am not a veteran', 'I don''t have a disability', '$160,000 - $180,000', '1 month', 'Senior Financial Software Engineer', 5, 'Available upon request', 'New York, NY; Remote', '7 years in fintech, payment systems', 'Full Remote', 'I''m a citizen', 'Payment processing and financial APIs expert'),

-- James Wilson metadata
('550e8400-e29b-41d4-a716-446655440007', 'Male', 'White', 'I am not a veteran', 'I don''t have a disability', '$120,000 - $140,000', '2 weeks', 'Senior E-commerce Developer', 10, 'Available upon request', 'Los Angeles, CA; Hybrid', '6 years in e-commerce development', 'Hybrid', 'I''m a citizen', 'Shopify and custom e-commerce platform expert');

-- Assign clients to managers
INSERT INTO client_managers (client_id, manager_id, notes) VALUES
-- Manager 1 (9d348bb2-3e75-40f0-a0de-730861afa363) - Tech and Healthcare
('550e8400-e29b-41d4-a716-446655440001', '9d348bb2-3e75-40f0-a0de-730861afa363', 'Strong technical background, actively seeking senior roles'),
('550e8400-e29b-41d4-a716-446655440002', '9d348bb2-3e75-40f0-a0de-730861afa363', 'ML expert, prefers remote work'),
('550e8400-e29b-41d4-a716-446655440003', '9d348bb2-3e75-40f0-a0de-730861afa363', 'DevOps specialist, cloud infrastructure focus'),
('550e8400-e29b-41d4-a716-446655440004', '9d348bb2-3e75-40f0-a0de-730861afa363', 'Medical background with software engineering skills'),
('550e8400-e29b-41d4-a716-446655440005', '9d348bb2-3e75-40f0-a0de-730861afa363', 'Healthcare data analysis expert'),

-- Manager 2 (a66fb9d8-648b-4fa9-a2fd-153d32b912dc) - Finance and E-commerce
('550e8400-e29b-41d4-a716-446655440006', 'a66fb9d8-648b-4fa9-a2fd-153d32b912dc', 'Fintech expert, payment systems specialist'),
('550e8400-e29b-41d4-a716-446655440007', 'a66fb9d8-648b-4fa9-a2fd-153d32b912dc', 'E-commerce platform developer');

-- Insert recruiters
INSERT INTO recruiters (id, name, email, company, position, linkedin_url, phone, notes, is_verified, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Sarah Johnson', 'sarah.johnson@recruiters.com', 'TechRecruit Pro', 'Senior Technical Recruiter', 'https://linkedin.com/in/sarahjohnson', '+1-555-0201', 'Specializes in technology roles, 5 years experience', true, NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Michael Chen', 'michael.chen@recruiters.com', 'HealthRecruit Solutions', 'Healthcare Recruiter', 'https://linkedin.com/in/michaelchen', '+1-555-0202', 'Healthcare industry expert, 7 years experience', true, NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Emily Rodriguez', 'emily.rodriguez@recruiters.com', 'FinRecruit Partners', 'Financial Recruiter', 'https://linkedin.com/in/emilyrodriguez', '+1-555-0203', 'Fintech and finance specialist, 4 years experience', true, NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'David Kim', 'david.kim@recruiters.com', 'EcomRecruit', 'E-commerce Recruiter', 'https://linkedin.com/in/davidkim', '+1-555-0204', 'E-commerce and retail expert, 6 years experience', true, NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Lisa Thompson', 'lisa.thompson@recruiters.com', 'TechRecruit Pro', 'Lead Technical Recruiter', 'https://linkedin.com/in/lisathompson', '+1-555-0205', 'Senior technology recruiter, 8 years experience', true, NOW()),
('660e8400-e29b-41d4-a716-446655440006', 'James Wilson', 'james.wilson@recruiters.com', 'TechRecruit Pro', 'Technical Recruiter', 'https://linkedin.com/in/jameswilson', '+1-555-0206', 'Junior technology recruiter, 3 years experience', false, NOW()),
('660e8400-e29b-41d4-a716-446655440007', 'Maria Garcia', 'maria.garcia@recruiters.com', 'HealthRecruit Solutions', 'Healthcare Recruiter', 'https://linkedin.com/in/mariagarcia', '+1-555-0207', 'Healthcare recruitment specialist, 6 years experience', true, NOW()),
('660e8400-e29b-41d4-a716-446655440008', 'Robert Brown', 'robert.brown@recruiters.com', 'FinRecruit Partners', 'Financial Recruiter', 'https://linkedin.com/in/robertbrown', '+1-555-0208', 'Finance and banking recruiter, 5 years experience', true, NOW());

-- Insert job listings (opportunities for the clients)
INSERT INTO job_listings (id, client_id, title, company, location, salary_range, job_url, description, application_method, application_url, status, created_at) VALUES
-- Opportunities for Alex Johnson (Full Stack Developer)
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Senior Full Stack Developer', 'TechFlow Solutions', 'San Francisco, CA', '$120,000 - $150,000', 'https://techflow.com/careers/senior-fullstack', 'Build scalable React applications for workflow automation platform', 'email', NULL, 'active', NOW()),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Full Stack Engineer', 'DataViz Pro', 'Remote', '$110,000 - $140,000', 'https://datavizpro.com/careers/fullstack', 'Develop robust Node.js APIs and React frontend', 'job_search_site', 'https://indeed.com/job/fullstack-engineer', 'active', NOW()),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Frontend Lead', 'CloudSync Inc', 'San Francisco, CA', '$130,000 - $160,000', 'https://cloudsync.com/careers/frontend-lead', 'Lead frontend development team building modern web apps', 'email', NULL, 'active', NOW()),

-- Opportunities for Sarah Chen (Data Scientist)
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Senior Data Scientist', 'AI Nexus', 'Austin, TX', '$140,000 - $170,000', 'https://ainexus.com/careers/senior-datascientist', 'Develop machine learning models for data visualization', 'email', NULL, 'active', NOW()),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'ML Engineer', 'DataCorp', 'Remote', '$130,000 - $160,000', 'https://datacorp.com/careers/ml-engineer', 'Build and deploy machine learning models', 'company_portal', 'https://datacorp.com/apply/ml-engineer', 'active', NOW()),
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Data Science Lead', 'TechFlow Solutions', 'Austin, TX', '$150,000 - $180,000', 'https://techflow.com/careers/datascience-lead', 'Lead data science initiatives and team', 'email', NULL, 'active', NOW()),

-- Opportunities for Michael Rodriguez (DevOps Engineer)
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Senior DevOps Engineer', 'CloudTech Systems', 'Seattle, WA', '$150,000 - $180,000', 'https://cloudtech.com/careers/senior-devops', 'Design and implement cloud-native solutions', 'email', NULL, 'active', NOW()),
('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Cloud Infrastructure Engineer', 'InfraCorp', 'Remote', '$140,000 - $170,000', 'https://infracorp.com/careers/cloud-engineer', 'Manage cloud infrastructure and automation', 'linkedin', 'https://linkedin.com/jobs/cloud-infrastructure', 'active', NOW()),

-- Opportunities for Dr. Emily Thompson (Healthcare Software Engineer)
('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'Healthcare Software Engineer', 'HealthTech Innovations', 'Nashville, TN', '$120,000 - $150,000', 'https://healthtech.com/careers/healthcare-engineer', 'Build healthcare management applications', 'email', NULL, 'active', NOW()),
('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'Medical Software Developer', 'MediCare Systems', 'Nashville, TN', '$110,000 - $140,000', 'https://medicare-systems.com/careers/medical-developer', 'Develop clinical software solutions', 'company_portal', 'https://medicare-systems.com/apply/medical-developer', 'active', NOW()),

-- Opportunities for David Kim (Clinical Data Analyst)
('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440005', 'Senior Clinical Data Analyst', 'HealthData Corp', 'Philadelphia, PA', '$90,000 - $120,000', 'https://healthdata.com/careers/senior-analyst', 'Analyze healthcare data and create reports', 'email', NULL, 'active', NOW()),
('770e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440005', 'Healthcare Data Scientist', 'MediCare Systems', 'Philadelphia, PA', '$100,000 - $130,000', 'https://medicare-systems.com/careers/healthcare-datascientist', 'Apply data science to healthcare problems', 'job_search_site', 'https://indeed.com/job/healthcare-datascientist', 'active', NOW()),

-- Opportunities for Lisa Wang (Financial Software Engineer)
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440006', 'Senior Financial Software Engineer', 'FinTech Dynamics', 'New York, NY', '$130,000 - $160,000', 'https://fintechdynamics.com/careers/senior-engineer', 'Build financial technology applications', 'email', NULL, 'active', NOW()),
('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440006', 'Payment Systems Engineer', 'SecureBank Pro', 'Remote', '$140,000 - $170,000', 'https://securebankpro.com/careers/payment-engineer', 'Develop payment processing systems', 'email', NULL, 'active', NOW()),

-- Opportunities for James Wilson (E-commerce Developer)
('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440007', 'Senior E-commerce Developer', 'ShopSmart Retail', 'Los Angeles, CA', '$100,000 - $130,000', 'https://shopsmart.com/careers/senior-ecommerce', 'Build online retail platforms', 'email', NULL, 'active', NOW()),
('770e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440007', 'E-commerce Platform Engineer', 'GlobalMarket', 'Remote', '$90,000 - $120,000', 'https://globalmarket.com/careers/ecommerce-engineer', 'Develop custom e-commerce solutions', 'linkedin', 'https://linkedin.com/jobs/ecommerce-platform', 'active', NOW());

-- Assign recruiters to email-based job listings
INSERT INTO job_recruiters (job_listing_id, recruiter_id, is_primary) VALUES
-- Alex Johnson opportunities - Email listings
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', true), -- Senior Full Stack Developer
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', true), -- Frontend Lead

-- Sarah Chen opportunities - Email listings
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', true), -- Senior Data Scientist
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440005', true), -- Data Science Lead

-- Michael Rodriguez opportunities - Email listings
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440006', true), -- Senior DevOps Engineer

-- Dr. Emily Thompson opportunities - Email listings
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440002', true), -- Healthcare Software Engineer

-- David Kim opportunities - Email listings
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440007', true), -- Senior Clinical Data Analyst

-- Lisa Wang opportunities - Email listings
('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440003', true), -- Senior Financial Software Engineer
('770e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440008', true), -- Payment Systems Engineer

-- James Wilson opportunities - Email listings
('770e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440004', true); -- Senior E-commerce Developer

-- Insert some sample email templates
INSERT INTO email_templates (id, user_id, name, subject, body, is_default, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', '9d348bb2-3e75-40f0-a0de-730861afa363', 'Initial Contact', 'Exciting Opportunity at {{company_name}}', 'Hi {{candidate_name}},\n\nI hope this email finds you well. I came across your profile and was impressed by your experience in {{skill_area}}.\n\nI''m reaching out because {{company_name}} is currently looking for a {{job_title}} to join their team. This role offers:\n\n- Competitive salary: {{salary_range}}\n- Location: {{location}}\n- Tech stack: {{tech_stack}}\n\nWould you be interested in learning more about this opportunity?\n\nBest regards,\n{{recruiter_name}}', false, NOW()),

('880e8400-e29b-41d4-a716-446655440002', '9d348bb2-3e75-40f0-a0de-730861afa363', 'Follow Up', 'Following up on {{company_name}} opportunity', 'Hi {{candidate_name}},\n\nI wanted to follow up on the {{job_title}} position at {{company_name}} that I mentioned in my previous email.\n\nHave you had a chance to review the opportunity? I''d be happy to schedule a call to discuss the role in more detail and answer any questions you might have.\n\nLooking forward to hearing from you!\n\nBest regards,\n{{recruiter_name}}', false, NOW()),

('880e8400-e29b-41d4-a716-446655440003', 'a66fb9d8-648b-4fa9-a2fd-153d32b912dc', 'Technical Interview Prep', 'Preparing for your interview at {{company_name}}', 'Hi {{candidate_name}},\n\nGreat news! {{company_name}} would like to move forward with your application for the {{job_title}} position.\n\nTo help you prepare for the technical interview, here are some key areas to focus on:\n\n- {{tech_stack}}\n- {{key_requirements}}\n- Company culture and values\n\nThe interview will be scheduled for {{interview_date}}.\n\nGood luck!\n\nBest regards,\n{{recruiter_name}}', false, NOW()); 