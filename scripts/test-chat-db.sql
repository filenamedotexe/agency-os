-- Step 1.4: Test Complete Database Setup for Chat System
-- This verifies all components from steps 1.1, 1.2, and 1.3 are working

-- ============================================
-- 1. TEST TABLE STRUCTURE
-- ============================================
\echo '=========================================='
\echo '1. TESTING TABLE STRUCTURE'
\echo '=========================================='

-- Check conversations table columns
SELECT 
    'conversations' as table_name,
    COUNT(*) as column_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversations'
GROUP BY table_name;

-- Check messages table columns
SELECT 
    'messages' as table_name,
    COUNT(*) as column_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
GROUP BY table_name;

-- Check conversation_participants table columns
SELECT 
    'conversation_participants' as table_name,
    COUNT(*) as column_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversation_participants'
GROUP BY table_name;

-- ============================================
-- 2. TEST FOREIGN KEY RELATIONSHIPS
-- ============================================
\echo '=========================================='
\echo '2. TESTING FOREIGN KEY RELATIONSHIPS'
\echo '=========================================='

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('conversations', 'messages', 'conversation_participants')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 3. TEST INDEXES
-- ============================================
\echo '=========================================='
\echo '3. TESTING INDEXES'
\echo '=========================================='

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages', 'conversation_participants')
AND indexname NOT LIKE '%_pkey'
AND indexname NOT LIKE '%_key'
ORDER BY tablename, indexname;

-- ============================================
-- 4. TEST RLS IS ENABLED
-- ============================================
\echo '=========================================='
\echo '4. TESTING ROW LEVEL SECURITY'
\echo '=========================================='

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages', 'conversation_participants')
ORDER BY tablename;

-- ============================================
-- 5. TEST RLS POLICIES
-- ============================================
\echo '=========================================='
\echo '5. TESTING RLS POLICIES'
\echo '=========================================='

SELECT 
    tablename,
    COUNT(*) as policy_count,
    array_agg(policyname ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages', 'conversation_participants')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 6. TEST REALTIME IS ENABLED
-- ============================================
\echo '=========================================='
\echo '6. TESTING REALTIME CONFIGURATION'
\echo '=========================================='

SELECT 
    pt.tablename,
    CASE 
        WHEN pt.tablename IS NOT NULL THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as realtime_status,
    p.pubinsert,
    p.pubupdate,
    p.pubdelete
FROM pg_publication p
LEFT JOIN pg_publication_tables pt 
    ON p.pubname = pt.pubname 
    AND pt.schemaname = 'public'
    AND pt.tablename = 'messages'
WHERE p.pubname = 'supabase_realtime';

-- ============================================
-- 7. TEST UNIQUE CONSTRAINTS
-- ============================================
\echo '=========================================='
\echo '7. TESTING UNIQUE CONSTRAINTS'
\echo '=========================================='

SELECT 
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
AND tc.table_name IN ('conversations', 'messages', 'conversation_participants')
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- ============================================
-- 8. TEST CHECK CONSTRAINTS
-- ============================================
\echo '=========================================='
\echo '8. TESTING CHECK CONSTRAINTS'
\echo '=========================================='

SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
    AND tc.constraint_schema = cc.constraint_schema
WHERE tc.constraint_type = 'CHECK'
AND tc.table_schema = 'public'
AND tc.table_name IN ('conversations', 'messages', 'conversation_participants')
ORDER BY tc.table_name;

-- ============================================
-- 9. FINAL STATUS SUMMARY
-- ============================================
\echo '=========================================='
\echo '9. FINAL STATUS SUMMARY'
\echo '=========================================='

SELECT 
    test_item,
    status,
    CASE 
        WHEN status = expected THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM (
    -- Tables exist
    SELECT 
        'Tables Created' as test_item,
        COUNT(*)::text as status,
        '3' as expected
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('conversations', 'messages', 'conversation_participants')
    
    UNION ALL
    
    -- RLS enabled
    SELECT 
        'RLS Enabled',
        COUNT(*)::text,
        '3'
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('conversations', 'messages', 'conversation_participants')
    AND rowsecurity = true
    
    UNION ALL
    
    -- Policies created
    SELECT 
        'RLS Policies Created',
        COUNT(*)::text,
        '9'
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('conversations', 'messages', 'conversation_participants')
    
    UNION ALL
    
    -- Realtime enabled
    SELECT 
        'Realtime Enabled on Messages',
        CASE 
            WHEN COUNT(*) > 0 THEN 'true'
            ELSE 'false'
        END,
        'true'
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'messages'
    
    UNION ALL
    
    -- Foreign keys
    SELECT 
        'Foreign Keys Created',
        COUNT(*)::text,
        '5'
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('conversations', 'messages', 'conversation_participants')
    
    UNION ALL
    
    -- Indexes
    SELECT 
        'Performance Indexes Created',
        COUNT(*)::text,
        '5'
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('conversations', 'messages', 'conversation_participants')
    AND indexname NOT LIKE '%_pkey'
    AND indexname NOT LIKE '%_key'
) tests
ORDER BY 
    CASE test_item
        WHEN 'Tables Created' THEN 1
        WHEN 'RLS Enabled' THEN 2
        WHEN 'RLS Policies Created' THEN 3
        WHEN 'Realtime Enabled on Messages' THEN 4
        WHEN 'Foreign Keys Created' THEN 5
        WHEN 'Performance Indexes Created' THEN 6
    END;

-- Final message
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) = 6 
            FROM (
                SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations' AND rowsecurity = true
                UNION ALL
                SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages' AND rowsecurity = true
                UNION ALL
                SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND rowsecurity = true
                UNION ALL
                SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
                UNION ALL
                SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('conversations', 'messages', 'conversation_participants') LIMIT 1
                UNION ALL
                SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('conversations', 'messages', 'conversation_participants') LIMIT 1
            ) checks
        )
        THEN E'\n🎉 DATABASE SETUP COMPLETE AND VERIFIED!\n\nThe chat system database is ready for use.'
        ELSE E'\n⚠️ DATABASE SETUP INCOMPLETE\n\nSome components may be missing. Please review the test results above.'
    END as final_status;