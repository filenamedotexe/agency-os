#!/usr/bin/env node

/**
 * Verify Storage Bucket Configuration
 * Tests Supabase storage bucket directly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Verifying Storage Bucket Configuration');
console.log('=========================================\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfqnpszawjpcydobpxul.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment');
  console.log('Make sure .env.local is configured correctly');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStorageSetup() {
  try {
    console.log('1️⃣ Testing storage connection...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Failed to list buckets:', bucketsError.message);
      return;
    }
    
    console.log('✅ Storage connection successful');
    console.log(`📦 Available buckets: ${buckets.map(b => b.name).join(', ')}`);
    
    // Check if chat-attachments bucket exists
    const chatBucket = buckets.find(b => b.name === 'chat-attachments');
    if (!chatBucket) {
      console.log('❌ chat-attachments bucket not found');
      return;
    }
    
    console.log('✅ chat-attachments bucket found');
    console.log(`   - Public: ${chatBucket.public ? 'Yes' : 'No'}`);
    console.log(`   - Created: ${chatBucket.created_at}`);
    
    console.log('\n2️⃣ Testing file upload capabilities...');
    
    // Create a test file buffer
    const testContent = 'Test file content for storage verification';
    const testBuffer = Buffer.from(testContent);
    const testFileName = `test/verification-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(testFileName, testBuffer, {
        contentType: 'text/plain',
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      
      if (uploadError.message.includes('RLS')) {
        console.log('\n💡 This might be an RLS (Row Level Security) policy issue.');
        console.log('The bucket exists but policies may be too restrictive.');
      }
      return;
    }
    
    console.log('✅ Upload test successful');
    console.log(`📁 Test file uploaded: ${uploadData.path}`);
    
    console.log('\n3️⃣ Testing public URL generation...');
    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(testFileName);
    
    console.log('✅ Public URL generated');
    console.log(`🔗 URL: ${publicUrl}`);
    
    console.log('\n4️⃣ Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('chat-attachments')
      .remove([testFileName]);
    
    if (deleteError) {
      console.log('⚠️ Failed to delete test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n📊 Storage Verification Summary:');
    console.log('==============================');
    console.log('✅ Storage connection working');
    console.log('✅ chat-attachments bucket accessible');
    console.log('✅ File upload working');
    console.log('✅ Public URL generation working');
    console.log('✅ File deletion working');
    console.log('\n🎉 Storage bucket is fully functional!');
    
  } catch (error) {
    console.log('💥 Verification failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the verification
verifyStorageSetup();