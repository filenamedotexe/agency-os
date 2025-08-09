-- Seed script for AgencyOS
-- Creates test users and sample data

-- First, delete existing test data to allow re-running
DELETE FROM tasks WHERE id IN (SELECT id FROM tasks LIMIT 1000);
DELETE FROM milestones WHERE id IN (SELECT id FROM milestones LIMIT 1000);
DELETE FROM services WHERE id IN (SELECT id FROM services LIMIT 1000);
DELETE FROM client_profiles WHERE profile_id IN (
  SELECT id FROM profiles WHERE email IN (
    'admin@agencyos.dev',
    'john@agencyos.dev', 
    'sarah@agencyos.dev',
    'client1@acme.com',
    'client2@techcorp.com',
    'client3@startup.io',
    'client4@enterprise.com',
    'client5@innovate.co'
  )
);
DELETE FROM profiles WHERE email IN (
  'admin@agencyos.dev',
  'john@agencyos.dev',
  'sarah@agencyos.dev', 
  'client1@acme.com',
  'client2@techcorp.com',
  'client3@startup.io',
  'client4@enterprise.com',
  'client5@innovate.co'
);
DELETE FROM auth.users WHERE email IN (
  'admin@agencyos.dev',
  'john@agencyos.dev',
  'sarah@agencyos.dev',
  'client1@acme.com',
  'client2@techcorp.com',
  'client3@startup.io',
  'client4@enterprise.com',
  'client5@innovate.co'
);

-- Create test users in auth.users
-- Admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'admin@agencyos.dev',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"first_name": "Admin", "last_name": "User", "role": "admin"}'::jsonb,
  NOW(),
  NOW()
);

-- Team Members
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES 
(
  'b2222222-2222-2222-2222-222222222222',
  'john@agencyos.dev',
  crypt('team123', gen_salt('bf')),
  NOW(),
  '{"first_name": "John", "last_name": "Smith", "role": "team_member"}'::jsonb,
  NOW(),
  NOW()
),
(
  'b3333333-3333-3333-3333-333333333333',
  'sarah@agencyos.dev',
  crypt('team123', gen_salt('bf')),
  NOW(),
  '{"first_name": "Sarah", "last_name": "Johnson", "role": "team_member"}'::jsonb,
  NOW(),
  NOW()
);

-- Client users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES 
(
  'c4444444-4444-4444-4444-444444444444',
  'client1@acme.com',
  crypt('client123', gen_salt('bf')),
  NOW(),
  '{"first_name": "Alice", "last_name": "Brown", "role": "client"}'::jsonb,
  NOW(),
  NOW()
),
(
  'c5555555-5555-5555-5555-555555555555',
  'client2@techcorp.com',
  crypt('client123', gen_salt('bf')),
  NOW(),
  '{"first_name": "Bob", "last_name": "Wilson", "role": "client"}'::jsonb,
  NOW(),
  NOW()
),
(
  'c6666666-6666-6666-6666-666666666666',
  'client3@startup.io',
  crypt('client123', gen_salt('bf')),
  NOW(),
  '{"first_name": "Carol", "last_name": "Davis", "role": "client"}'::jsonb,
  NOW(),
  NOW()
),
(
  'c7777777-7777-7777-7777-777777777777',
  'client4@enterprise.com',
  crypt('client123', gen_salt('bf')),
  NOW(),
  '{"first_name": "David", "last_name": "Miller", "role": "client"}'::jsonb,
  NOW(),
  NOW()
),
(
  'c8888888-8888-8888-8888-888888888888',
  'client5@innovate.co',
  crypt('client123', gen_salt('bf')),
  NOW(),
  '{"first_name": "Emma", "last_name": "Taylor", "role": "client"}'::jsonb,
  NOW(),
  NOW()
);

-- Profiles will be created automatically by trigger

-- Update client profiles with company data
UPDATE client_profiles SET
  company_name = 'Acme Corporation',
  phone = '+1 (555) 123-4567',
  address = '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}'::jsonb,
  industry = 'Technology',
  website = 'https://acme.com',
  company_size = '50-100',
  annual_revenue = '$5M-$10M',
  notes = 'Key client - handles our main product line',
  tags = ARRAY['premium', 'tech', 'priority']
WHERE profile_id = 'c4444444-4444-4444-4444-444444444444';

UPDATE client_profiles SET
  company_name = 'TechCorp Solutions',
  phone = '+1 (555) 234-5678',
  address = '{"street": "456 Tech Ave", "city": "San Francisco", "state": "CA", "zip": "94102", "country": "USA"}'::jsonb,
  industry = 'Software',
  website = 'https://techcorp.com',
  company_size = '100-500',
  annual_revenue = '$10M-$50M',
  notes = 'Growing rapidly, interested in expansion services',
  tags = ARRAY['software', 'saas', 'growth']
WHERE profile_id = 'c5555555-5555-5555-5555-555555555555';

UPDATE client_profiles SET
  company_name = 'Startup.io',
  phone = '+1 (555) 345-6789',
  address = '{"street": "789 Innovation Blvd", "city": "Austin", "state": "TX", "zip": "78701", "country": "USA"}'::jsonb,
  industry = 'Startup',
  website = 'https://startup.io',
  company_size = '10-50',
  annual_revenue = '$1M-$5M',
  notes = 'Early stage startup, needs MVP development',
  tags = ARRAY['startup', 'mvp', 'agile']
WHERE profile_id = 'c6666666-6666-6666-6666-666666666666';

UPDATE client_profiles SET
  company_name = 'Enterprise Corp',
  phone = '+1 (555) 456-7890',
  address = '{"street": "321 Corporate Way", "city": "Chicago", "state": "IL", "zip": "60601", "country": "USA"}'::jsonb,
  industry = 'Finance',
  website = 'https://enterprise.com',
  company_size = '1000+',
  annual_revenue = '$100M+',
  notes = 'Enterprise client - requires extensive compliance',
  tags = ARRAY['enterprise', 'finance', 'compliance']
WHERE profile_id = 'c7777777-7777-7777-7777-777777777777';

UPDATE client_profiles SET
  company_name = 'Innovate Co',
  phone = '+1 (555) 567-8901',
  address = '{"street": "555 Creative Lane", "city": "Seattle", "state": "WA", "zip": "98101", "country": "USA"}'::jsonb,
  industry = 'Creative',
  website = 'https://innovate.co',
  company_size = '10-50',
  annual_revenue = '$1M-$5M',
  notes = 'Creative agency partner - collaborative projects',
  tags = ARRAY['creative', 'design', 'marketing']
WHERE profile_id = 'c8888888-8888-8888-8888-888888888888';

-- Create sample services
INSERT INTO services (id, name, description, client_id, status, budget, start_date, end_date, created_by)
VALUES
(
  'd1111111-1111-1111-1111-111111111111',
  'Website Redesign',
  'Complete redesign of corporate website with modern UI/UX',
  'c4444444-4444-4444-4444-444444444444',
  'in_progress',
  75000.00,
  '2025-01-01',
  '2025-03-31',
  'a1111111-1111-1111-1111-111111111111'
),
(
  'd2222222-2222-2222-2222-222222222222',
  'Mobile App Development',
  'Native iOS and Android app development',
  'c5555555-5555-5555-5555-555555555555',
  'planning',
  150000.00,
  '2025-02-01',
  '2025-07-31',
  'a1111111-1111-1111-1111-111111111111'
),
(
  'd3333333-3333-3333-3333-333333333333',
  'MVP Development',
  'Minimum viable product for new startup idea',
  'c6666666-6666-6666-6666-666666666666',
  'in_progress',
  45000.00,
  '2024-12-01',
  '2025-02-28',
  'b2222222-2222-2222-2222-222222222222'
),
(
  'd4444444-4444-4444-4444-444444444444',
  'Enterprise System Integration',
  'Integration with existing enterprise systems',
  'c7777777-7777-7777-7777-777777777777',
  'planning',
  250000.00,
  '2025-03-01',
  '2025-09-30',
  'a1111111-1111-1111-1111-111111111111'
),
(
  'd5555555-5555-5555-5555-555555555555',
  'Brand Identity Package',
  'Complete brand identity and marketing materials',
  'c8888888-8888-8888-8888-888888888888',
  'completed',
  35000.00,
  '2024-10-01',
  '2024-12-31',
  'b3333333-3333-3333-3333-333333333333'
);

-- Create milestones for Website Redesign
INSERT INTO milestones (service_id, title, description, due_date, status, order_index)
VALUES
('d1111111-1111-1111-1111-111111111111', 'Discovery & Research', 'User research and requirements gathering', '2025-01-15', 'completed', 1),
('d1111111-1111-1111-1111-111111111111', 'Design Mockups', 'Create high-fidelity design mockups', '2025-02-01', 'in_progress', 2),
('d1111111-1111-1111-1111-111111111111', 'Development', 'Frontend and backend development', '2025-03-01', 'pending', 3),
('d1111111-1111-1111-1111-111111111111', 'Testing & Launch', 'QA testing and production deployment', '2025-03-31', 'pending', 4);

-- Create tasks for first milestone
INSERT INTO tasks (milestone_id, title, description, assignee_id, status, priority, due_date, estimated_hours)
SELECT 
  m.id,
  task_title,
  task_desc,
  assignee::uuid,
  task_status,
  task_priority,
  task_due::date,
  est_hours
FROM milestones m
CROSS JOIN (
  VALUES 
    ('User interviews', 'Conduct stakeholder interviews', 'b2222222-2222-2222-2222-222222222222', 'completed', 'high', '2025-01-10', 8),
    ('Competitor analysis', 'Analyze competitor websites', 'b3333333-3333-3333-3333-333333333333', 'completed', 'medium', '2025-01-12', 6),
    ('Requirements document', 'Create detailed requirements', 'b2222222-2222-2222-2222-222222222222', 'completed', 'high', '2025-01-15', 10)
) AS tasks(task_title, task_desc, assignee, task_status, task_priority, task_due, est_hours)
WHERE m.service_id = 'd1111111-1111-1111-1111-111111111111' 
AND m.order_index = 1;