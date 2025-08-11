-- Verify Realtime Setup for Chat

-- Check if messages table has realtime enabled
SELECT 
    'messages' as table_name,
    EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) as realtime_enabled;

-- Check publication configuration
SELECT 
    pubname,
    pubinsert,
    pubupdate,
    pubdelete,
    pubtruncate
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- Count total tables with realtime enabled
SELECT 
    COUNT(*) as tables_with_realtime
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Verify messages table structure for realtime compatibility
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Check if we need to enable realtime for other tables
SELECT 
    'conversations' as table_name,
    EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'conversations'
    ) as realtime_enabled
UNION ALL
SELECT 
    'conversation_participants',
    EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'conversation_participants'
    );

SELECT 'Realtime verification complete!' as status;