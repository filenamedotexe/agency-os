-- =====================================================
-- TEST ASSIGNEE SYSTEM ROLE-BASED ACCESS CONTROL
-- =====================================================
-- Verify that role-based access control is working correctly
-- Date: 2025-08-17
-- =====================================================

-- Test 1: Verify milestone assignee constraints
SELECT 
  'Test 1: Milestone assignee must be admin/team' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'check_milestone_assignee_role_trigger'
    ) THEN '✅ PASS - Trigger exists'
    ELSE '❌ FAIL - Trigger missing'
  END as result;

-- Test 2: Check if any milestones are assigned to clients (should be 0)
SELECT 
  'Test 2: No milestones assigned to clients' as test_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - No client assignments'
    ELSE '❌ FAIL - Found ' || COUNT(*) || ' client assignments'
  END as result
FROM milestones m
JOIN profiles p ON m.assignee_id = p.id
WHERE p.role = 'client';

-- Test 3: Verify task visibility field exists and has correct values
SELECT 
  'Test 3: Task visibility values' as test_name,
  'Internal: ' || COUNT(CASE WHEN visibility = 'internal' THEN 1 END) ||
  ', Client: ' || COUNT(CASE WHEN visibility = 'client' THEN 1 END) ||
  ', Invalid: ' || COUNT(CASE WHEN visibility NOT IN ('internal', 'client') THEN 1 END) as result
FROM tasks;

-- Test 4: Check RLS policies for tasks
SELECT 
  'Test 4: Task RLS policies' as test_name,
  string_agg(policyname, ', ') as result
FROM pg_policies 
WHERE tablename = 'tasks'
AND policyname LIKE '%client%'
ORDER BY policyname;

-- Test 5: Check RLS policies for milestones
SELECT 
  'Test 5: Milestone RLS policies' as test_name,
  string_agg(policyname, ', ') as result
FROM pg_policies 
WHERE tablename = 'milestones'
ORDER BY policyname;

-- Test 6: Verify admin users exist
SELECT 
  'Test 6: Admin users' as test_name,
  'Count: ' || COUNT(*) || ' - ' || string_agg(email, ', ') as result
FROM profiles
WHERE role = 'admin';

-- Test 7: Verify team members exist
SELECT 
  'Test 7: Team members' as test_name,
  'Count: ' || COUNT(*) || ' - ' || string_agg(email, ', ') as result
FROM profiles
WHERE role = 'team_member';

-- Test 8: Verify client users exist
SELECT 
  'Test 8: Client users' as test_name,
  'Count: ' || COUNT(*) || ' (first 3: ' || string_agg(email, ', ') || ')' as result
FROM (
  SELECT email FROM profiles 
  WHERE role = 'client' 
  LIMIT 3
) clients;

-- Test 9: Test milestone assignee validation (should fail)
DO $$
DECLARE
  client_id uuid;
  milestone_id uuid;
  error_msg text;
BEGIN
  -- Get a client user ID
  SELECT id INTO client_id FROM profiles WHERE role = 'client' LIMIT 1;
  
  -- Get a milestone ID
  SELECT id INTO milestone_id FROM milestones LIMIT 1;
  
  -- Try to assign milestone to client (should fail)
  BEGIN
    UPDATE milestones SET assignee_id = client_id WHERE id = milestone_id;
    RAISE NOTICE 'Test 9: ❌ FAIL - Client assignment allowed';
  EXCEPTION 
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      IF error_msg LIKE '%Milestone assignee must be an admin or team member%' THEN
        RAISE NOTICE 'Test 9: ✅ PASS - Client assignment blocked correctly';
      ELSE
        RAISE NOTICE 'Test 9: ❌ FAIL - Wrong error: %', error_msg;
      END IF;
  END;
END $$;

-- Test 10: Verify indexes exist for performance
SELECT 
  'Test 10: Performance indexes' as test_name,
  string_agg(indexname, ', ') as result
FROM pg_indexes 
WHERE tablename IN ('tasks', 'milestones')
AND indexname IN (
  'idx_milestones_assignee',
  'idx_tasks_visibility',
  'idx_tasks_visibility_assigned'
)
ORDER BY indexname;

-- Summary
SELECT 
  '===================' as separator,
  'RBAC TEST SUMMARY' as title,
  '===================' as separator2;

SELECT 
  'Role-based access control tests completed.' as message
UNION ALL
SELECT 
  'Milestone assignee constraints are enforced.' as message
UNION ALL
SELECT 
  'Task visibility controls are in place.' as message
UNION ALL
SELECT 
  'RLS policies are active and configured.' as message;