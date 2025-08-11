-- Verify chat tables structure

-- Check conversations table
\d conversations

-- Check messages table  
\d messages

-- Check conversation_participants table
\d conversation_participants

-- List all indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('conversations', 'messages', 'conversation_participants')
ORDER BY tablename, indexname;

-- Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('conversations', 'messages', 'conversation_participants');