-- Test that Realtime is properly configured for chat

-- Check our specific messages table in public schema
SELECT 
    pt.schemaname,
    pt.tablename,
    pt.pubname,
    p.pubinsert,
    p.pubupdate,
    p.pubdelete
FROM pg_publication_tables pt
JOIN pg_publication p ON p.pubname = pt.pubname
WHERE pt.schemaname = 'public' 
AND pt.tablename = 'messages'
AND pt.pubname = 'supabase_realtime';

-- Verify the table is ready for realtime operations
SELECT 
    t.schemaname,
    t.tablename,
    obj_description(c.oid) as table_comment,
    CASE 
        WHEN pt.tablename IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as realtime_enabled,
    CASE
        WHEN t.rowsecurity = true THEN 'YES'
        ELSE 'NO'
    END as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (
    SELECT oid FROM pg_namespace WHERE nspname = t.schemaname
)
LEFT JOIN pg_publication_tables pt ON pt.schemaname = t.schemaname 
    AND pt.tablename = t.tablename 
    AND pt.pubname = 'supabase_realtime'
WHERE t.schemaname = 'public' 
AND t.tablename IN ('conversations', 'messages', 'conversation_participants')
ORDER BY t.tablename;

-- Final status
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND pubname = 'supabase_realtime'
        )
        THEN '✅ Realtime is ENABLED for public.messages table'
        ELSE '❌ Realtime is NOT enabled for public.messages table'
    END as realtime_status;