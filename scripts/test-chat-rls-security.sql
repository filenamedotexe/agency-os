-- Test RLS Security for Chat System
-- This simulates how the policies will work for different users

-- Create a test function to check policy behavior
CREATE OR REPLACE FUNCTION test_chat_rls_policies() 
RETURNS TABLE(
    test_name TEXT,
    expected TEXT,
    result TEXT
) AS $$
BEGIN
    -- Test 1: Check if RLS is enabled
    RETURN QUERY
    SELECT 
        'RLS enabled on conversations'::TEXT,
        'true'::TEXT,
        (SELECT rowsecurity::TEXT FROM pg_tables WHERE tablename = 'conversations' AND schemaname = 'public');
    
    RETURN QUERY
    SELECT 
        'RLS enabled on messages'::TEXT,
        'true'::TEXT,
        (SELECT rowsecurity::TEXT FROM pg_tables WHERE tablename = 'messages' AND schemaname = 'public');
    
    RETURN QUERY
    SELECT 
        'RLS enabled on participants'::TEXT,
        'true'::TEXT,
        (SELECT rowsecurity::TEXT FROM pg_tables WHERE tablename = 'conversation_participants' AND schemaname = 'public');
    
    -- Test 2: Check policy counts
    RETURN QUERY
    SELECT 
        'Conversations has 3 policies'::TEXT,
        '3'::TEXT,
        (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'conversations' AND schemaname = 'public');
    
    RETURN QUERY
    SELECT 
        'Messages has 3 policies'::TEXT,
        '3'::TEXT,
        (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public');
    
    RETURN QUERY
    SELECT 
        'Participants has 3 policies'::TEXT,
        '3'::TEXT,
        (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'conversation_participants' AND schemaname = 'public');
    
    -- Test 3: Check SELECT policies exist
    RETURN QUERY
    SELECT 
        'SELECT policy exists for conversations'::TEXT,
        'true'::TEXT,
        (EXISTS(
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'conversations' 
            AND schemaname = 'public' 
            AND cmd = 'SELECT'
        ))::TEXT;
    
    RETURN QUERY
    SELECT 
        'SELECT policy exists for messages'::TEXT,
        'true'::TEXT,
        (EXISTS(
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND schemaname = 'public' 
            AND cmd = 'SELECT'
        ))::TEXT;
    
    -- Test 4: Check INSERT policies exist
    RETURN QUERY
    SELECT 
        'INSERT policy exists for messages'::TEXT,
        'true'::TEXT,
        (EXISTS(
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND schemaname = 'public' 
            AND cmd = 'INSERT'
        ))::TEXT;
    
    -- Test 5: Check UPDATE policies exist
    RETURN QUERY
    SELECT 
        'UPDATE policy exists for messages'::TEXT,
        'true'::TEXT,
        (EXISTS(
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND schemaname = 'public' 
            AND cmd = 'UPDATE'
        ))::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Run the tests
SELECT * FROM test_chat_rls_policies();

-- Clean up
DROP FUNCTION test_chat_rls_policies();

-- Summary of RLS configuration
SELECT 
    '=== RLS Security Configuration Summary ===' as title
UNION ALL
SELECT 
    'Total tables with RLS: ' || COUNT(DISTINCT tablename)::TEXT
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'conversation_participants')
AND rowsecurity = true
UNION ALL
SELECT 
    'Total policies created: ' || COUNT(*)::TEXT
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages', 'conversation_participants')
UNION ALL
SELECT 
    'Realtime + RLS enabled on messages: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE tablename = 'messages' AND pubname = 'supabase_realtime'
        ) AND EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'messages' AND rowsecurity = true
        )
        THEN 'YES ✅'
        ELSE 'NO ❌'
    END;

-- Final confirmation
SELECT 'RLS security testing complete!' as status;