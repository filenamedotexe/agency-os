-- Create all test users through Supabase Auth properly
-- Run this after the database schema is set up

-- Create remaining test users (admin already exists)
DO $$
DECLARE
  user_record RECORD;
  new_user_id UUID;
BEGIN
  -- Array of users to create
  FOR user_record IN 
    SELECT * FROM (VALUES
      ('john@agencyos.dev'::text, 'password123'::text, 'John'::text, 'Smith'::text, 'team_member'::user_role),
      ('sarah@agencyos.dev', 'password123', 'Sarah', 'Johnson', 'team_member'),
      ('client1@acme.com', 'password123', 'Alice', 'Brown', 'client'),
      ('client2@techcorp.com', 'password123', 'Bob', 'Wilson', 'client'),
      ('client3@startup.io', 'password123', 'Carol', 'Davis', 'client')
    ) AS t(email, password, first_name, last_name, role)
  LOOP
    -- Generate UUID for new user
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      new_user_id,
      user_record.email,
      crypt(user_record.password, gen_salt('bf')),
      NOW(), -- Auto-confirm for testing
      jsonb_build_object(
        'first_name', user_record.first_name,
        'last_name', user_record.last_name,
        'role', user_record.role::text
      ),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
    
    -- The trigger will handle creating profiles
    RAISE NOTICE 'Created user: %', user_record.email;
  END LOOP;
END $$;

-- Update profiles with correct role from user_metadata
UPDATE profiles p
SET role = (u.raw_user_meta_data->>'role')::user_role
FROM auth.users u
WHERE p.id = u.id
AND u.raw_user_meta_data->>'role' IS NOT NULL;

-- Create client profiles for client users
INSERT INTO client_profiles (profile_id, company_name, phone, industry, website, notes)
SELECT 
  p.id,
  CASE p.email
    WHEN 'client1@acme.com' THEN 'Acme Corporation'
    WHEN 'client2@techcorp.com' THEN 'TechCorp Solutions'
    WHEN 'client3@startup.io' THEN 'Startup.io'
    ELSE 'Client Company'
  END,
  '+1 (555) 123-4567',
  'Technology',
  CASE p.email
    WHEN 'client1@acme.com' THEN 'https://acme.com'
    WHEN 'client2@techcorp.com' THEN 'https://techcorp.com'
    WHEN 'client3@startup.io' THEN 'https://startup.io'
    ELSE 'https://example.com'
  END,
  'Test client account'
FROM profiles p
WHERE p.role = 'client'
AND p.id NOT IN (SELECT profile_id FROM client_profiles)
ON CONFLICT (profile_id) DO NOTHING;

-- Create sample services for testing
INSERT INTO services (name, description, client_id, status, budget, start_date, end_date, created_by)
SELECT 
  'Website Redesign',
  'Complete redesign of corporate website',
  (SELECT id FROM profiles WHERE email = 'client1@acme.com'),
  'in_progress',
  75000.00,
  '2025-01-01'::date,
  '2025-03-31'::date,
  (SELECT id FROM profiles WHERE email = 'admin@agencyos.dev')
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Website Redesign');

-- Verify users were created
SELECT 
  p.email, 
  p.role, 
  p.first_name || ' ' || p.last_name as full_name,
  CASE WHEN cp.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_client_profile
FROM profiles p
LEFT JOIN client_profiles cp ON cp.profile_id = p.id
ORDER BY 
  CASE p.role 
    WHEN 'admin' THEN 1 
    WHEN 'team_member' THEN 2 
    WHEN 'client' THEN 3 
  END,
  p.email;