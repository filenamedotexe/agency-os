-- Final Database Setup Summary for Chat System

-- Quick status check
WITH test_results AS (
    SELECT 
        'Tables' as component,
        COUNT(*) as actual,
        3 as expected
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('conversations', 'messages', 'conversation_participants')
    
    UNION ALL
    
    SELECT 
        'RLS Enabled',
        COUNT(*),
        3
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('conversations', 'messages', 'conversation_participants')
    AND rowsecurity = true
    
    UNION ALL
    
    SELECT 
        'Policies',
        COUNT(*),
        9
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('conversations', 'messages', 'conversation_participants')
    
    UNION ALL
    
    SELECT 
        'Realtime',
        COUNT(*),
        1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'messages'
    
    UNION ALL
    
    SELECT 
        'Foreign Keys',
        COUNT(*),
        5
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
    AND table_name IN ('conversations', 'messages', 'conversation_participants')
    
    UNION ALL
    
    SELECT 
        'Indexes',
        COUNT(*),
        5
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('conversations', 'messages', 'conversation_participants')
    AND indexname NOT LIKE '%_pkey'
    AND indexname NOT LIKE '%_key'
)
SELECT 
    component,
    actual || '/' || expected as count,
    CASE 
        WHEN actual = expected THEN '✅'
        ELSE '❌'
    END as status
FROM test_results
ORDER BY 
    CASE component
        WHEN 'Tables' THEN 1
        WHEN 'RLS Enabled' THEN 2
        WHEN 'Policies' THEN 3
        WHEN 'Realtime' THEN 4
        WHEN 'Foreign Keys' THEN 5
        WHEN 'Indexes' THEN 6
    END;

-- Overall status
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) = 6
            FROM (
                SELECT component FROM test_results WHERE actual = expected
            ) passed_tests
        )
        THEN E'\n✅ CHAT DATABASE SETUP COMPLETE!\n\nAll components verified and working:\n• 3 tables with proper structure\n• RLS enabled with 9 policies\n• Realtime enabled on messages\n• All foreign keys and indexes in place\n\nReady for Step 2: File Upload Infrastructure'
        ELSE E'\n⚠️ SETUP INCOMPLETE - Review failed components above'
    END as "Database Status"
FROM (SELECT 1) x;

-- Show database is ready for connections
SELECT 
    current_database() as database,
    current_user as connected_as,
    version() as postgres_version;