-- Step 2.1: Create Storage Bucket for Chat Attachments
-- This creates a private bucket for file uploads in chat

-- First, check if bucket already exists
SELECT 
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'chat-attachments';

-- Create the chat-attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments', 
  false, -- Private bucket (users need auth to access)
  10485760, -- 10MB limit (10 * 1024 * 1024 bytes)
  ARRAY[
    -- Images
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/svg+xml',
    
    -- Documents
    'application/pdf',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    -- Text files
    'text/plain',
    'text/csv',
    
    -- Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verify bucket was created
SELECT 
    id, 
    name, 
    public,
    file_size_limit,
    CASE 
        WHEN file_size_limit = 10485760 THEN '10MB'
        ELSE (file_size_limit / 1024 / 1024)::text || 'MB'
    END as size_limit,
    array_length(allowed_mime_types, 1) as allowed_types_count,
    created_at
FROM storage.buckets 
WHERE id = 'chat-attachments';

-- Show allowed file types
SELECT 
    'Allowed file types:' as info,
    unnest(allowed_mime_types) as mime_type
FROM storage.buckets 
WHERE id = 'chat-attachments'
ORDER BY mime_type;

-- Success message
SELECT 'Chat attachments storage bucket created successfully!' as status;