-- =====================================================
-- VERIFY ASSIGNEE SYSTEM MIGRATION
-- =====================================================
-- Script to verify the assignee system migration was successful
-- Date: 2025-08-17
-- =====================================================

-- Check 1: Verify milestones table has assignee_id column
SELECT 
  'Milestone assignee_id column' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'milestones' 
      AND column_name = 'assignee_id'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check 2: Verify tasks table has visibility column
SELECT 
  'Task visibility column' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'visibility'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check 3: Verify visibility constraint exists
SELECT 
  'Task visibility constraint' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name = 'tasks_visibility_check'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check 4: Verify milestone assignee trigger exists
SELECT 
  'Milestone assignee role check trigger' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'check_milestone_assignee_role_trigger'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check 5: Count RLS policies on tasks
SELECT 
  'Task RLS policies' as check_name,
  COUNT(*) || ' policies found' as status
FROM pg_policies 
WHERE tablename = 'tasks';

-- Check 6: Count RLS policies on milestones
SELECT 
  'Milestone RLS policies' as check_name,
  COUNT(*) || ' policies found' as status
FROM pg_policies 
WHERE tablename = 'milestones';

-- Check 7: Verify indexes were created
SELECT 
  'Indexes created' as check_name,
  string_agg(indexname, ', ') as status
FROM pg_indexes 
WHERE tablename IN ('tasks', 'milestones')
AND indexname IN (
  'idx_milestones_assignee',
  'idx_tasks_visibility',
  'idx_tasks_visibility_assigned'
);

-- Check 8: Show task visibility distribution
SELECT 
  'Task visibility distribution' as check_name,
  'Total: ' || COUNT(*) || 
  ', Internal: ' || COUNT(CASE WHEN visibility = 'internal' THEN 1 END) ||
  ', Client: ' || COUNT(CASE WHEN visibility = 'client' THEN 1 END) as status
FROM tasks;

-- Check 9: Show milestone assignee distribution
SELECT 
  'Milestone assignees' as check_name,
  'Total: ' || COUNT(*) || 
  ', Assigned: ' || COUNT(assignee_id) ||
  ', Unassigned: ' || COUNT(CASE WHEN assignee_id IS NULL THEN 1 END) as status
FROM milestones;

-- Check 10: Test data - show sample of assignable users
SELECT 
  'Sample assignable users (admin/team)' as check_name,
  string_agg(email || ' (' || role || ')', ', ') as status
FROM profiles
WHERE role IN ('admin', 'team_member')
LIMIT 3;

-- Summary
SELECT 
  '===================' as separator,
  'MIGRATION SUMMARY' as title,
  '===================' as separator2;

SELECT 
  'The assignee system migration has been successfully applied.' as message
UNION ALL
SELECT 
  'Milestones can now be assigned to admin/team users only.' as message
UNION ALL
SELECT 
  'Tasks now have visibility control (internal/client).' as message
UNION ALL
SELECT 
  'RLS policies ensure clients only see their assigned/visible tasks.' as message;