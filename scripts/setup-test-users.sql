-- Create test users with password123
-- This script creates test users directly in the database

-- Function to create a user with a specific password
DO $$
DECLARE
    admin_id UUID;
    team_id UUID;
    client_id UUID;
BEGIN
    -- Create admin user if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@agencyos.dev') THEN
        admin_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            instance_id,
            aud,
            role
        ) VALUES (
            admin_id,
            'admin@agencyos.dev',
            crypt('password123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated'
        );
        
        INSERT INTO profiles (id, email, first_name, last_name, role, created_at, updated_at)
        VALUES (admin_id, 'admin@agencyos.dev', 'Admin', 'User', 'admin', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'admin';
        
        RAISE NOTICE 'Created admin@agencyos.dev';
    ELSE
        -- Update password for existing user
        UPDATE auth.users 
        SET encrypted_password = crypt('password123', gen_salt('bf'))
        WHERE email = 'admin@agencyos.dev';
        
        UPDATE profiles SET role = 'admin' WHERE email = 'admin@agencyos.dev';
        RAISE NOTICE 'Updated admin@agencyos.dev';
    END IF;

    -- Create team member user if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'john@agencyos.dev') THEN
        team_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            instance_id,
            aud,
            role
        ) VALUES (
            team_id,
            'john@agencyos.dev',
            crypt('password123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated'
        );
        
        INSERT INTO profiles (id, email, first_name, last_name, role, created_at, updated_at)
        VALUES (team_id, 'john@agencyos.dev', 'John', 'Team', 'team_member', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'team_member';
        
        RAISE NOTICE 'Created john@agencyos.dev';
    ELSE
        -- Update password for existing user
        UPDATE auth.users 
        SET encrypted_password = crypt('password123', gen_salt('bf'))
        WHERE email = 'john@agencyos.dev';
        
        UPDATE profiles SET role = 'team_member' WHERE email = 'john@agencyos.dev';
        RAISE NOTICE 'Updated john@agencyos.dev';
    END IF;

    -- Create client user if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'client@agencyos.dev') THEN
        client_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            instance_id,
            aud,
            role
        ) VALUES (
            client_id,
            'client@agencyos.dev',
            crypt('password123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated'
        );
        
        INSERT INTO profiles (id, email, first_name, last_name, role, created_at, updated_at)
        VALUES (client_id, 'client@agencyos.dev', 'Client', 'User', 'client', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'client';
        
        -- Create client profile
        INSERT INTO client_profiles (profile_id, company_name, created_at, updated_at)
        VALUES (client_id, 'Test Company', NOW(), NOW())
        ON CONFLICT (profile_id) DO NOTHING;
        
        RAISE NOTICE 'Created client@agencyos.dev';
    ELSE
        -- Update password for existing user
        UPDATE auth.users 
        SET encrypted_password = crypt('password123', gen_salt('bf'))
        WHERE email = 'client@agencyos.dev';
        
        UPDATE profiles SET role = 'client' WHERE email = 'client@agencyos.dev';
        
        -- Ensure client profile exists
        INSERT INTO client_profiles (profile_id, company_name, created_at, updated_at)
        SELECT id, 'Test Company', NOW(), NOW()
        FROM auth.users 
        WHERE email = 'client@agencyos.dev'
        ON CONFLICT (profile_id) DO NOTHING;
        
        RAISE NOTICE 'Updated client@agencyos.dev';
    END IF;
END $$;

-- Verify users were created
SELECT email, role FROM profiles WHERE email IN ('admin@agencyos.dev', 'john@agencyos.dev', 'client@agencyos.dev');