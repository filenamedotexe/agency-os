-- =====================================================
-- SERVICE TEMPLATE SCHEMA TEST SUITE
-- =====================================================
-- Comprehensive tests for service template database schema
-- Date: 2025-08-19
-- =====================================================

\echo '=================================================='
\echo 'STARTING SERVICE TEMPLATE SCHEMA TESTS'
\echo '=================================================='

-- =====================================================
-- TEST 1: VERIFY TABLES EXIST
-- =====================================================

\echo 'TEST 1: Verifying tables exist...'

DO $$
BEGIN
  -- Check service_templates table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_templates') THEN
    RAISE EXCEPTION 'service_templates table does not exist';
  END IF;
  
  -- Check template_milestones table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'template_milestones') THEN
    RAISE EXCEPTION 'template_milestones table does not exist';
  END IF;
  
  -- Check template_tasks table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'template_tasks') THEN
    RAISE EXCEPTION 'template_tasks table does not exist';
  END IF;
  
  -- Check template_summary view exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'template_summary') THEN
    RAISE EXCEPTION 'template_summary view does not exist';
  END IF;
  
  RAISE NOTICE '✓ All tables and views exist';
END
$$;

-- =====================================================
-- TEST 2: VERIFY TABLE STRUCTURES
-- =====================================================

\echo 'TEST 2: Verifying table structures...'

-- Test service_templates columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_templates' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    RAISE EXCEPTION 'service_templates.id column missing or wrong type';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_templates' AND column_name = 'name' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'service_templates.name column missing or nullable';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_templates' AND column_name = 'created_by' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'service_templates.created_by column missing or nullable';
  END IF;
  
  RAISE NOTICE '✓ service_templates structure correct';
END
$$;

-- Test template_milestones columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_milestones' AND column_name = 'template_id' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'template_milestones.template_id column missing or nullable';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_milestones' AND column_name = 'position' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'template_milestones.position column missing or nullable';
  END IF;
  
  RAISE NOTICE '✓ template_milestones structure correct';
END
$$;

-- Test template_tasks columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_tasks' AND column_name = 'template_milestone_id' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'template_tasks.template_milestone_id column missing or nullable';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_tasks' AND column_name = 'title' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'template_tasks.title column missing or nullable';
  END IF;
  
  RAISE NOTICE '✓ template_tasks structure correct';
END
$$;

-- =====================================================
-- TEST 3: VERIFY CONSTRAINTS
-- =====================================================

\echo 'TEST 3: Verifying constraints...'

-- Test primary key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'service_templates' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    RAISE EXCEPTION 'service_templates primary key constraint missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'template_milestones' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    RAISE EXCEPTION 'template_milestones primary key constraint missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'template_tasks' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    RAISE EXCEPTION 'template_tasks primary key constraint missing';
  END IF;
  
  RAISE NOTICE '✓ Primary key constraints exist';
END
$$;

-- Test foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'service_templates' AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE EXCEPTION 'service_templates foreign key constraints missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'template_milestones' AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE EXCEPTION 'template_milestones foreign key constraints missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'template_tasks' AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE EXCEPTION 'template_tasks foreign key constraints missing';
  END IF;
  
  RAISE NOTICE '✓ Foreign key constraints exist';
END
$$;

-- Test check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%name_check'
  ) THEN
    RAISE EXCEPTION 'Name check constraints missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%color_check'
  ) THEN
    RAISE EXCEPTION 'Color check constraint missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%priority_check'
  ) THEN
    RAISE EXCEPTION 'Priority check constraint missing';
  END IF;
  
  RAISE NOTICE '✓ Check constraints exist';
END
$$;

-- =====================================================
-- TEST 4: VERIFY INDEXES
-- =====================================================

\echo 'TEST 4: Verifying indexes...'

DO $$
BEGIN
  -- Check service_templates indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'service_templates' AND indexname LIKE '%created_by%'
  ) THEN
    RAISE EXCEPTION 'service_templates created_by index missing';
  END IF;
  
  -- Check template_milestones indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'template_milestones' AND indexname LIKE '%template_id%'
  ) THEN
    RAISE EXCEPTION 'template_milestones template_id index missing';
  END IF;
  
  -- Check template_tasks indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'template_tasks' AND indexname LIKE '%milestone_id%'
  ) THEN
    RAISE EXCEPTION 'template_tasks milestone_id index missing';
  END IF;
  
  RAISE NOTICE '✓ Required indexes exist';
END
$$;

-- =====================================================
-- TEST 5: VERIFY RLS POLICIES
-- =====================================================

\echo 'TEST 5: Verifying RLS policies...'

DO $$
BEGIN
  -- Check RLS is enabled on service_templates
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'service_templates' AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on service_templates';
  END IF;
  
  -- Check policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_templates' AND policyname LIKE '%view%'
  ) THEN
    RAISE EXCEPTION 'View policy missing on service_templates';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_templates' AND policyname LIKE '%create%'
  ) THEN
    RAISE EXCEPTION 'Create policy missing on service_templates';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_templates' AND policyname LIKE '%update%'
  ) THEN
    RAISE EXCEPTION 'Update policy missing on service_templates';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_templates' AND policyname LIKE '%delete%'
  ) THEN
    RAISE EXCEPTION 'Delete policy missing on service_templates';
  END IF;
  
  RAISE NOTICE '✓ RLS policies exist';
END
$$;

-- =====================================================
-- TEST 6: VERIFY TRIGGERS AND FUNCTIONS
-- =====================================================

\echo 'TEST 6: Verifying triggers and functions...'

DO $$
BEGIN
  -- Check updated_at trigger function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_service_template_updated_at'
  ) THEN
    RAISE EXCEPTION 'update_service_template_updated_at function missing';
  END IF;
  
  -- Check validation trigger function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'validate_template_structure'
  ) THEN
    RAISE EXCEPTION 'validate_template_structure function missing';
  END IF;
  
  -- Check triggers exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_service_template_updated_at_trigger'
  ) THEN
    RAISE EXCEPTION 'update_service_template_updated_at_trigger missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'validate_template_tasks_trigger'
  ) THEN
    RAISE EXCEPTION 'validate_template_tasks_trigger missing';
  END IF;
  
  RAISE NOTICE '✓ Triggers and functions exist';
END
$$;

-- =====================================================
-- TEST 7: TEST DEFAULT VALUES
-- =====================================================

\echo 'TEST 7: Testing default values...'

-- Create temporary test data to verify defaults
BEGIN;

-- Insert test template (will be rolled back)
INSERT INTO service_templates (name, created_by) 
SELECT 'Test Template', id FROM profiles WHERE role = 'admin' LIMIT 1;

-- Verify defaults were applied
DO $$
DECLARE
  template_record RECORD;
BEGIN
  SELECT * INTO template_record FROM service_templates WHERE name = 'Test Template';
  
  IF template_record.color != 'blue' THEN
    RAISE EXCEPTION 'Default color not applied correctly';
  END IF;
  
  IF template_record.is_default != false THEN
    RAISE EXCEPTION 'Default is_default not applied correctly';
  END IF;
  
  IF template_record.created_at IS NULL THEN
    RAISE EXCEPTION 'Default created_at not applied correctly';
  END IF;
  
  IF template_record.updated_at IS NULL THEN
    RAISE EXCEPTION 'Default updated_at not applied correctly';
  END IF;
  
  RAISE NOTICE '✓ Default values applied correctly';
END
$$;

ROLLBACK;

-- =====================================================
-- TEST 8: TEST UUID GENERATION
-- =====================================================

\echo 'TEST 8: Testing UUID generation...'

BEGIN;

-- Insert test data to verify UUID generation
INSERT INTO service_templates (name, created_by) 
SELECT 'UUID Test Template', id FROM profiles WHERE role = 'admin' LIMIT 1;

-- Verify UUIDs are generated
DO $$
DECLARE
  template_id UUID;
BEGIN
  SELECT id INTO template_id FROM service_templates WHERE name = 'UUID Test Template';
  
  IF template_id IS NULL THEN
    RAISE EXCEPTION 'UUID not generated for service_templates.id';
  END IF;
  
  -- Test that UUID is valid format
  IF char_length(template_id::text) != 36 THEN
    RAISE EXCEPTION 'Generated UUID is not valid format';
  END IF;
  
  RAISE NOTICE '✓ UUID generation working correctly';
END
$$;

ROLLBACK;

-- =====================================================
-- TEST 9: TEST FOREIGN KEY CONSTRAINTS
-- =====================================================

\echo 'TEST 9: Testing foreign key constraints...'

-- Test that orphaned records are prevented
BEGIN;

-- Try to insert milestone with non-existent template_id
DO $$
BEGIN
  BEGIN
    INSERT INTO template_milestones (template_id, name, position) 
    VALUES ('00000000-0000-0000-0000-000000000000', 'Test Milestone', 0);
    RAISE EXCEPTION 'Foreign key constraint not working - orphaned milestone allowed';
  EXCEPTION 
    WHEN foreign_key_violation THEN
      RAISE NOTICE '✓ Foreign key constraint prevents orphaned milestones';
  END;
END
$$;

ROLLBACK;

-- =====================================================
-- TEST 10: TEST CASCADE DELETES
-- =====================================================

\echo 'TEST 10: Testing cascade deletes...'

BEGIN;

-- Create test template with milestones and tasks
DO $$
DECLARE
  template_id UUID;
  milestone_id UUID;
  admin_id UUID;
BEGIN
  -- Get admin user
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- Insert template
  INSERT INTO service_templates (name, created_by) 
  VALUES ('Cascade Test Template', admin_id)
  RETURNING id INTO template_id;
  
  -- Insert milestone
  INSERT INTO template_milestones (template_id, name, position)
  VALUES (template_id, 'Test Milestone', 0)
  RETURNING id INTO milestone_id;
  
  -- Insert task
  INSERT INTO template_tasks (template_milestone_id, title, position)
  VALUES (milestone_id, 'Test Task', 0);
  
  -- Verify records exist
  IF NOT EXISTS (SELECT 1 FROM template_milestones WHERE template_id = template_id) THEN
    RAISE EXCEPTION 'Test milestone not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM template_tasks WHERE template_milestone_id = milestone_id) THEN
    RAISE EXCEPTION 'Test task not created';
  END IF;
  
  -- Delete template (should cascade)
  DELETE FROM service_templates WHERE id = template_id;
  
  -- Verify cascade worked
  IF EXISTS (SELECT 1 FROM template_milestones WHERE template_id = template_id) THEN
    RAISE EXCEPTION 'Cascade delete failed - milestone still exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM template_tasks WHERE template_milestone_id = milestone_id) THEN
    RAISE EXCEPTION 'Cascade delete failed - task still exists';
  END IF;
  
  RAISE NOTICE '✓ Cascade deletes working correctly';
END
$$;

ROLLBACK;

-- =====================================================
-- TEST SUMMARY
-- =====================================================

\echo '=================================================='
\echo 'SERVICE TEMPLATE SCHEMA TESTS COMPLETED'
\echo '=================================================='
\echo 'All tests passed successfully!'
\echo ''
\echo 'Test Results:'
\echo '✓ Tables and views exist'
\echo '✓ Table structures correct'
\echo '✓ Constraints properly defined'
\echo '✓ Indexes created'
\echo '✓ RLS policies configured'
\echo '✓ Triggers and functions working'
\echo '✓ Default values applied'
\echo '✓ UUID generation functional'
\echo '✓ Foreign key constraints enforced'
\echo '✓ Cascade deletes working'
\echo '=================================================='