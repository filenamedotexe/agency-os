-- Step 2.2 Verification: Test Chat Storage Policies
-- This script verifies that all storage policies are working correctly

-- ============================================
-- COMPREHENSIVE POLICY VERIFICATION
-- ============================================

-- 1. Verify bucket exists with correct settings
SELECT '=== BUCKET VERIFICATION ===' as section;

SELECT 
    id as bucket_id,
    name as bucket_name,
    CASE 
        WHEN public = false THEN '✓ Private (secure)'
        ELSE '✗ Public (insecure)'
    END as privacy_status,
    CASE 
        WHEN file_size_limit = 10485760 THEN '✓ 10MB limit set'
        ELSE '⚠ Unexpected limit: ' || (file_size_limit / 1024 / 1024)::text || 'MB'
    END as size_limit_status,
    CASE 
        WHEN array_length(allowed_mime_types, 1) = 17 THEN '✓ 17 MIME types allowed'
        ELSE '⚠ Unexpected MIME type count: ' || array_length(allowed_mime_types, 1)::text
    END as mime_types_status
FROM storage.buckets 
WHERE id = 'chat-attachments';

-- 2. Verify RLS is enabled on storage.objects
SELECT '=== RLS VERIFICATION ===' as section;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✓ RLS ENABLED - Security active'
        ELSE '✗ RLS DISABLED - SECURITY RISK!'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 3. Verify all 4 required policies exist
SELECT '=== POLICY EXISTENCE VERIFICATION ===' as section;

WITH expected_policies AS (
    SELECT unnest(ARRAY[
        'Users can upload attachments',
        'Users can view attachments', 
        'Users can delete own attachments',
        'Service role can manage all attachments'
    ]) as policy_name
),
actual_policies AS (
    SELECT policyname
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND (policyname LIKE '%attachment%' OR policyname LIKE '%chat%')
)
SELECT 
    ep.policy_name,
    CASE 
        WHEN ap.policyname IS NOT NULL THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
FROM expected_policies ep
LEFT JOIN actual_policies ap ON ep.policy_name = ap.policyname
ORDER BY ep.policy_name;

-- 4. Detailed policy analysis
SELECT '=== DETAILED POLICY ANALYSIS ===' as section;

SELECT 
    policyname,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT (read)'
        WHEN cmd = 'a' THEN 'INSERT (create)' 
        WHEN cmd = 'd' THEN 'DELETE (remove)'
        WHEN cmd = 'w' THEN 'UPDATE (modify)'
        WHEN cmd = '*' THEN 'ALL (full access)'
        ELSE 'UNKNOWN: ' || cmd
    END as permission_type,
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✓ Permissive'
        ELSE '⚠ Restrictive: ' || permissive
    END as policy_type,
    CASE 
        WHEN with_check IS NOT NULL THEN '✓ Has WITH CHECK (insert/update security)'
        ELSE '- No WITH CHECK'
    END as with_check_analysis,
    CASE 
        WHEN qual IS NOT NULL THEN '✓ Has USING (select/delete security)'
        ELSE '- No USING clause'
    END as using_analysis
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%attachment%' OR policyname LIKE '%chat%')
ORDER BY policyname;

-- 5. Security verification - check for dangerous configurations
SELECT '=== SECURITY AUDIT ===' as section;

-- Check for overly permissive policies
WITH security_check AS (
    SELECT 
        policyname,
        CASE 
            WHEN qual IS NULL AND cmd = 'r' THEN 'WARNING: No SELECT restrictions'
            WHEN with_check IS NULL AND cmd = 'a' THEN 'WARNING: No INSERT restrictions'  
            WHEN qual IS NULL AND cmd = 'd' THEN 'WARNING: No DELETE restrictions'
            ELSE 'OK'
        END as security_status,
        CASE 
            WHEN (qual ILIKE '%bucket_id = ''chat-attachments''%' OR 
                  with_check ILIKE '%bucket_id = ''chat-attachments''%') THEN 'OK'
            ELSE 'WARNING: No bucket restriction found'
        END as bucket_restriction_status
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND (policyname LIKE '%attachment%' OR policyname LIKE '%chat%')
)
SELECT 
    policyname,
    security_status,
    bucket_restriction_status,
    CASE 
        WHEN security_status = 'OK' AND bucket_restriction_status = 'OK' THEN '✓ SECURE'
        ELSE '⚠ REVIEW NEEDED'
    END as overall_security
FROM security_check
ORDER BY policyname;

-- 6. Test specific policy constraints
SELECT '=== POLICY CONSTRAINT TESTING ===' as section;

-- Check upload policy has user folder restriction
SELECT 
    policyname,
    CASE 
        WHEN with_check ILIKE '%foldername%' AND with_check ILIKE '%auth.uid%' THEN 
            '✓ Upload restricted to user folders'
        ELSE '⚠ Upload folder restriction missing or incorrect'
    END as upload_folder_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname = 'Users can upload attachments';

-- Check delete policy has user folder restriction  
SELECT 
    policyname,
    CASE 
        WHEN qual ILIKE '%foldername%' AND qual ILIKE '%auth.uid%' THEN 
            '✓ Delete restricted to user folders'
        ELSE '⚠ Delete folder restriction missing or incorrect'
    END as delete_folder_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname = 'Users can delete own attachments';

-- Check service role policy has correct permissions
SELECT 
    policyname,
    CASE 
        WHEN cmd = '*' AND qual ILIKE '%service_role%' AND with_check ILIKE '%service_role%' THEN 
            '✓ Service role has full access'
        ELSE '⚠ Service role permissions incorrect'
    END as service_role_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname = 'Service role can manage all attachments';

-- 7. Final summary
SELECT '=== FINAL VERIFICATION SUMMARY ===' as section;

WITH policy_count AS (
    SELECT COUNT(*) as total
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND (policyname LIKE '%attachment%' OR policyname LIKE '%chat%')
),
bucket_check AS (
    SELECT 
        CASE WHEN id = 'chat-attachments' THEN 1 ELSE 0 END as exists,
        CASE WHEN public = false THEN 1 ELSE 0 END as private,
        CASE WHEN file_size_limit = 10485760 THEN 1 ELSE 0 END as correct_size,
        CASE WHEN array_length(allowed_mime_types, 1) = 17 THEN 1 ELSE 0 END as correct_mime_count
    FROM storage.buckets 
    WHERE id = 'chat-attachments'
),
rls_check AS (
    SELECT 
        CASE WHEN rowsecurity = true THEN 1 ELSE 0 END as rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'storage' AND tablename = 'objects'
)
SELECT 
    pc.total as policies_created,
    bc.exists as bucket_exists,
    bc.private as is_private,
    bc.correct_size as size_limit_ok,
    bc.correct_mime_count as mime_types_ok,
    rc.rls_enabled as rls_active,
    CASE 
        WHEN pc.total = 4 AND bc.exists = 1 AND bc.private = 1 AND 
             bc.correct_size = 1 AND bc.correct_mime_count = 1 AND rc.rls_enabled = 1 
        THEN '✅ ALL SYSTEMS GO - Storage policies fully configured and secure!'
        ELSE '⚠️ ISSUES DETECTED - Review output above for details'
    END as final_status
FROM policy_count pc, bucket_check bc, rls_check rc;

-- Success confirmation
SELECT 'Chat storage policies verification completed!' as completion_status;