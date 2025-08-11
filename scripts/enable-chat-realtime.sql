-- Step 1.2: Enable Realtime for Chat Messages
-- This allows real-time subscriptions to the messages table

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verify realtime is enabled
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE tablename = 'messages';

-- Check if publication exists
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- List all tables in the realtime publication
SELECT 
    schemaname,
    tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Success message
SELECT 'Realtime enabled for messages table!' as status;