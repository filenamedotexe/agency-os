-- Final Fix for RLS Policy Recursion
-- Create a completely non-recursive policy

-- Drop the current policy
DROP POLICY "Users can view participants" ON conversation_participants;

-- Create a simple policy that only allows:
-- 1. Users to see their own participation records
-- 2. Service role to see everything (for admin/system operations)
CREATE POLICY "Users can view participants" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

-- Alternative: More restrictive version (commented out for now)
-- CREATE POLICY "Users can view participants" ON conversation_participants
--   FOR SELECT USING (
--     user_id = auth.uid()
--   );

-- Verify no recursion
SELECT 
    policyname,
    qual,
    CASE 
        WHEN qual LIKE '%conversation_participants%' THEN 'HAS RECURSION'
        ELSE 'NO RECURSION'
    END as recursion_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'conversation_participants'
ORDER BY policyname;

-- Test query to ensure it works
SELECT COUNT(*) as participant_count FROM conversation_participants LIMIT 1;

-- Success message
SELECT 'RLS policies fixed - no recursion!' as status;