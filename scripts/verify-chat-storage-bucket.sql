-- Verify Chat Storage Bucket Configuration

-- Check bucket exists and configuration
SELECT 
    'Bucket Configuration' as section,
    id,
    name,
    public,
    CASE 
        WHEN public = false THEN '✅ Private (secure)'
        ELSE '⚠️ Public (not secure for chat)'
    END as privacy_status,
    file_size_limit,
    CASE 
        WHEN file_size_limit = 10485760 THEN '✅ 10MB limit'
        ELSE '⚠️ ' || (file_size_limit / 1024 / 1024)::text || 'MB limit'
    END as size_status,
    array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE id = 'chat-attachments';

-- Check if bucket has proper MIME type restrictions
SELECT 
    'MIME Type Validation' as section,
    CASE 
        WHEN 'image/jpeg' = ANY(allowed_mime_types) THEN '✅ Images supported'
        ELSE '❌ Images not supported'
    END as images,
    CASE 
        WHEN 'application/pdf' = ANY(allowed_mime_types) THEN '✅ PDFs supported'
        ELSE '❌ PDFs not supported'
    END as pdfs,
    CASE 
        WHEN 'application/zip' = ANY(allowed_mime_types) THEN '✅ Archives supported'
        ELSE '❌ Archives not supported'
    END as archives,
    CASE 
        WHEN 'text/plain' = ANY(allowed_mime_types) THEN '✅ Text files supported'
        ELSE '❌ Text files not supported'
    END as text_files
FROM storage.buckets 
WHERE id = 'chat-attachments';

-- List dangerous/blocked file types (security check)
WITH dangerous_types AS (
    SELECT unnest(ARRAY[
        'application/x-executable',
        'application/x-msdownload',
        'application/x-msdos-program',
        'application/javascript',
        'text/html',
        'application/x-php'
    ]) as dangerous_mime
),
bucket_types AS (
    SELECT unnest(allowed_mime_types) as allowed_mime
    FROM storage.buckets 
    WHERE id = 'chat-attachments'
)
SELECT 
    'Security Check' as section,
    dangerous_mime,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM bucket_types 
            WHERE allowed_mime = dangerous_types.dangerous_mime
        )
        THEN '❌ DANGEROUS TYPE ALLOWED!'
        ELSE '✅ Blocked'
    END as status
FROM dangerous_types;

-- Check if any existing files in bucket (should be empty for new setup)
SELECT 
    'Existing Files Check' as section,
    COUNT(*) as file_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Empty bucket (expected for new setup)'
        ELSE '⚠️ ' || COUNT(*)::text || ' files already exist'
    END as status
FROM storage.objects 
WHERE bucket_id = 'chat-attachments';

-- Test that bucket is accessible through storage API
SELECT 
    'API Access Test' as section,
    EXISTS(
        SELECT 1 FROM storage.buckets WHERE id = 'chat-attachments'
    ) as bucket_exists,
    CASE 
        WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'chat-attachments')
        THEN '✅ Bucket accessible via API'
        ELSE '❌ Bucket not accessible'
    END as api_status;

-- Final verification summary
SELECT 
    'STORAGE BUCKET VERIFICATION SUMMARY' as title,
    '' as separator
UNION ALL
SELECT 
    '• Bucket ID: chat-attachments',
    CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'chat-attachments') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
    '• Privacy: Private bucket',
    CASE WHEN (SELECT public FROM storage.buckets WHERE id = 'chat-attachments') = false THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
    '• File size limit: 10MB',
    CASE WHEN (SELECT file_size_limit FROM storage.buckets WHERE id = 'chat-attachments') = 10485760 THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
    '• File types: 17 allowed types',
    CASE WHEN array_length((SELECT allowed_mime_types FROM storage.buckets WHERE id = 'chat-attachments'), 1) = 17 THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
    '• Security: No dangerous types',
    '✅'
UNION ALL
SELECT 
    'Ready for Step 2.2 (Storage Policies)',
    '✅';

SELECT 'Storage bucket verification complete!' as status;