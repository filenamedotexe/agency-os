#!/usr/bin/env node

/**
 * Setup Storage Policies for Chat Attachments
 * Ensures proper RLS policies for file uploads
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DATABASE_URL = 'postgresql://postgres:agency-final@db.lfqnpszawjpcydobpxul.supabase.co:5432/postgres';

async function runQuery(query) {
  try {
    const { stdout, stderr } = await execPromise(`psql "${DATABASE_URL}" -c "${query}"`);
    if (stderr && !stderr.includes('NOTICE')) {
      console.error('Error:', stderr);
    }
    return stdout;
  } catch (error) {
    console.error('Query failed:', error.message);
    throw error;
  }
}

async function setupStoragePolicies() {
  console.log('🔧 Setting up Storage Policies for Chat Attachments');
  console.log('================================================\n');

  try {
    // 1. Enable RLS on storage.objects if not already enabled
    console.log('1️⃣ Enabling RLS on storage.objects...');
    await runQuery('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS enabled\n');

    // 2. Drop existing problematic policies
    console.log('2️⃣ Cleaning up existing policies...');
    const dropPolicies = [
      "DROP POLICY IF EXISTS \"Users can upload attachments\" ON storage.objects;",
      "DROP POLICY IF EXISTS \"Users can view attachments\" ON storage.objects;",
      "DROP POLICY IF EXISTS \"Users can delete own attachments\" ON storage.objects;",
      "DROP POLICY IF EXISTS \"Service role can manage all attachments\" ON storage.objects;"
    ];

    for (const query of dropPolicies) {
      await runQuery(query);
    }
    console.log('✅ Old policies removed\n');

    // 3. Create new proper policies
    console.log('3️⃣ Creating new storage policies...');

    // Policy for authenticated users to upload
    await runQuery(`
      CREATE POLICY "Authenticated users can upload attachments" 
      ON storage.objects 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (
        bucket_id = 'chat-attachments' AND
        auth.uid() IS NOT NULL
      );
    `);
    console.log('✅ Upload policy created');

    // Policy for authenticated users to view
    await runQuery(`
      CREATE POLICY "Authenticated users can view attachments" 
      ON storage.objects 
      FOR SELECT 
      TO authenticated 
      USING (
        bucket_id = 'chat-attachments'
      );
    `);
    console.log('✅ View policy created');

    // Policy for users to update their own uploads
    await runQuery(`
      CREATE POLICY "Users can update own attachments" 
      ON storage.objects 
      FOR UPDATE 
      TO authenticated 
      USING (
        bucket_id = 'chat-attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    `);
    console.log('✅ Update policy created');

    // Policy for users to delete their own uploads
    await runQuery(`
      CREATE POLICY "Users can delete own attachments" 
      ON storage.objects 
      FOR DELETE 
      TO authenticated 
      USING (
        bucket_id = 'chat-attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    `);
    console.log('✅ Delete policy created');

    // 4. Verify policies
    console.log('\n4️⃣ Verifying policies...');
    const result = await runQuery(`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage' 
      ORDER BY policyname;
    `);
    console.log('Current policies:', result);

    console.log('\n✅ Storage policies setup complete!');
    console.log('📌 The chat-attachments bucket is now properly configured for:');
    console.log('   - Authenticated users can upload files');
    console.log('   - Authenticated users can view all attachments');
    console.log('   - Users can update/delete their own uploads');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupStoragePolicies().catch(console.error);