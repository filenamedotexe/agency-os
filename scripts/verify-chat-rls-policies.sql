-- Verify RLS Policies for Chat System

-- List all policies with their details
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages', 'conversation_participants')
ORDER BY tablename, policyname;

-- Check specific policy definitions for conversations
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
        ELSE 'No WITH CHECK'
    END as check_clause
FROM pg_policies
WHERE tablename = 'conversations'
AND schemaname = 'public'
ORDER BY policyname;

-- Check specific policy definitions for messages
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
        ELSE 'No WITH CHECK'
    END as check_clause
FROM pg_policies
WHERE tablename = 'messages'
AND schemaname = 'public'
ORDER BY policyname;

-- Check specific policy definitions for participants
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
        ELSE 'No WITH CHECK'
    END as check_clause
FROM pg_policies
WHERE tablename = 'conversation_participants'
AND schemaname = 'public'
ORDER BY policyname;

-- Verify RLS is enforced
SELECT 
    n.nspname as schema,
    c.relname as table,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced,
    COUNT(p.polname) as policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
AND c.relname IN ('conversations', 'messages', 'conversation_participants')
GROUP BY n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relname;

-- Final status check
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename IN ('conversations', 'messages', 'conversation_participants')
        ) >= 9
        THEN '✅ All RLS policies are properly configured'
        ELSE '❌ Some RLS policies may be missing'
    END as rls_status,
    (
        SELECT COUNT(*) FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('conversations', 'messages', 'conversation_participants')
    ) as total_policies;