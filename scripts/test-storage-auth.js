#!/usr/bin/env node

/**
 * Test Storage with Authentication
 * Tests storage operations with authenticated user context
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Testing Storage with Authentication');
console.log('=====================================\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Service role client (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Anon client (for user simulation)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageAuth() {
  try {
    console.log('1️⃣ Testing admin storage access...');
    
    // Test admin upload
    const adminTestContent = 'Admin test upload - ' + new Date().toISOString();
    const adminTestBuffer = Buffer.from(adminTestContent);
    const adminTestFile = `admin-test/test-${Date.now()}.txt`;
    
    const { data: adminUpload, error: adminError } = await supabaseAdmin.storage
      .from('chat-attachments')
      .upload(adminTestFile, adminTestBuffer, {
        contentType: 'text/plain'
      });
    
    if (adminError) {
      console.log('❌ Admin upload failed:', adminError.message);
    } else {
      console.log('✅ Admin upload successful:', adminUpload.path);
    }

    console.log('\n2️⃣ Testing authenticated user simulation...');
    
    // Simulate authenticated user by signing in
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: 'admin@demo.com',
      password: 'password123'
    });
    
    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      return;
    }
    
    console.log('✅ User authenticated:', authData.user?.email);
    
    // Test authenticated upload
    const userTestContent = 'User test upload - ' + new Date().toISOString();
    const userTestBuffer = Buffer.from(userTestContent);
    const userTestFile = `${authData.user.id}/test-${Date.now()}.txt`;
    
    const { data: userUpload, error: userError } = await supabaseClient.storage
      .from('chat-attachments')
      .upload(userTestFile, userTestBuffer, {
        contentType: 'text/plain'
      });
    
    if (userError) {
      console.log('❌ User upload failed:', userError.message);
      console.log('   This indicates RLS policy issues');
    } else {
      console.log('✅ User upload successful:', userUpload.path);
      
      // Test public URL generation
      const { data: { publicUrl } } = supabaseClient.storage
        .from('chat-attachments')
        .getPublicUrl(userTestFile);
      
      console.log('✅ Public URL generated:', publicUrl);
      
      // Test download access
      try {
        const response = await fetch(publicUrl);
        if (response.ok) {
          console.log('✅ File accessible via public URL');
        } else {
          console.log('❌ File not accessible:', response.status);
        }
      } catch (fetchError) {
        console.log('❌ Fetch error:', fetchError.message);
      }
    }

    console.log('\n3️⃣ Testing bucket policies via SQL...');
    
    // Check existing policies
    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');
    
    if (policyError) {
      console.log('❌ Failed to fetch policies:', policyError.message);
    } else {
      console.log(`✅ Found ${policies.length} storage policies:`);
      policies.forEach(p => {
        console.log(`   - ${p.policyname}: ${p.cmd} for ${p.roles?.join(', ')}`);
      });
    }

    console.log('\n4️⃣ Manual policy setup instructions...');
    console.log('=====================================');
    console.log('If uploads are still failing, manually create these policies in Supabase dashboard:');
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/lfqnpszawjpcydobpxul/storage/policies');
    console.log('');
    console.log('Policy 1 - SELECT (View files):');
    console.log('  Name: "Allow authenticated users to view attachments"');
    console.log('  Operation: SELECT');
    console.log('  Target roles: authenticated');
    console.log('  USING expression: bucket_id = \'chat-attachments\'');
    console.log('');
    console.log('Policy 2 - INSERT (Upload files):');
    console.log('  Name: "Allow authenticated users to upload attachments"');
    console.log('  Operation: INSERT');
    console.log('  Target roles: authenticated');
    console.log('  WITH CHECK: bucket_id = \'chat-attachments\' AND auth.uid() IS NOT NULL');
    
    console.log('\n📊 Storage Authentication Test Results:');
    console.log('======================================');
    console.log(`Admin Upload: ${adminError ? '❌' : '✅'}`);
    console.log(`User Auth: ${authError ? '❌' : '✅'}`);
    console.log(`User Upload: ${userError ? '❌ (RLS issue)' : '✅'}`);
    console.log(`Policy Check: ${policyError ? '❌' : '✅'}`);
    
    // Cleanup
    if (!adminError) {
      await supabaseAdmin.storage.from('chat-attachments').remove([adminTestFile]);
    }
    if (!userError) {
      await supabaseClient.storage.from('chat-attachments').remove([userTestFile]);
    }
    
    console.log('\n✅ Test files cleaned up');

  } catch (error) {
    console.log('💥 Storage auth test failed:', error.message);
  }
}

// Run the test
testStorageAuth();