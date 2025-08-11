#!/usr/bin/env node

/**
 * Setup Storage Bucket for Chat Attachments
 * Creates bucket and sets up proper policies
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Setting up Chat Attachments Storage Bucket');
console.log('============================================\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Use anon key for testing user operations
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function setupChatAttachmentsBucket() {
  try {
    console.log('1️⃣ Checking existing buckets...');
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Failed to list buckets:', listError.message);
      return;
    }
    
    console.log(`📦 Current buckets: ${buckets.map(b => b.name).join(', ') || 'none'}`);
    
    // Check if chat-attachments bucket exists
    let chatBucket = buckets.find(b => b.name === 'chat-attachments');
    
    if (!chatBucket) {
      console.log('\n2️⃣ Creating chat-attachments bucket...');
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('chat-attachments', {
        public: false, // Keep it private for security
        allowedMimeTypes: [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv'
        ],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.log('❌ Failed to create bucket:', createError.message);
        return;
      }
      
      console.log('✅ chat-attachments bucket created');
      chatBucket = newBucket;
    } else {
      console.log('✅ chat-attachments bucket already exists');
    }
    
    console.log('\n3️⃣ Testing file upload with anon user...');
    
    // Test upload without authentication first
    const testContent = 'Test upload for bucket verification';
    const testBuffer = Buffer.from(testContent);
    const testFileName = `test/setup-verification-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('chat-attachments')
      .upload(testFileName, testBuffer, {
        contentType: 'text/plain',
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      
      if (uploadError.message.includes('new row violates row-level security')) {
        console.log('\n4️⃣ Setting up RLS policies...');
        
        // We can't directly set RLS policies with the JS SDK, but we can create a SQL script
        console.log('📝 RLS policies need to be set up manually in Supabase dashboard:');
        console.log('\nGo to: Storage → Policies → New Policy');
        console.log('\nPolicy for SELECT (viewing files):');
        console.log('Policy name: "Allow authenticated users to view attachments"');
        console.log('Allowed operation: SELECT');
        console.log('Target roles: authenticated');
        console.log('USING expression: bucket_id = \'chat-attachments\'');
        
        console.log('\nPolicy for INSERT (uploading files):');
        console.log('Policy name: "Allow authenticated users to upload attachments"');
        console.log('Allowed operation: INSERT'); 
        console.log('Target roles: authenticated');
        console.log('WITH CHECK expression: bucket_id = \'chat-attachments\' AND auth.uid() IS NOT NULL');
        
        console.log('\nPolicy for UPDATE (modifying files):');
        console.log('Policy name: "Allow users to update own attachments"');
        console.log('Allowed operation: UPDATE');
        console.log('Target roles: authenticated');
        console.log('USING expression: bucket_id = \'chat-attachments\' AND (storage.foldername(name))[1] = auth.uid()::text');
        
        console.log('\nPolicy for DELETE (deleting files):');
        console.log('Policy name: "Allow users to delete own attachments"');
        console.log('Allowed operation: DELETE');
        console.log('Target roles: authenticated');
        console.log('USING expression: bucket_id = \'chat-attachments\' AND (storage.foldername(name))[1] = auth.uid()::text');
        
      }
    } else {
      console.log('✅ Upload test successful');
      console.log(`📁 Test file uploaded: ${uploadData.path}`);
      
      // Clean up test file
      const { error: deleteError } = await supabaseClient.storage
        .from('chat-attachments')
        .remove([testFileName]);
      
      if (!deleteError) {
        console.log('✅ Test file cleaned up');
      }
    }
    
    console.log('\n📊 Setup Summary:');
    console.log('================');
    console.log('✅ Storage connection working');
    console.log('✅ chat-attachments bucket created/verified');
    console.log(`✅ Bucket configuration: Private, 10MB limit`);
    console.log('✅ Supported file types: images, PDF, DOC, DOCX, TXT, CSV');
    
    if (uploadError) {
      console.log('⚠️  RLS policies need manual setup in Supabase dashboard');
      console.log('🔗 Dashboard: https://supabase.com/dashboard/project/lfqnpszawjpcydobpxul/storage/policies');
    } else {
      console.log('✅ File operations working correctly');
    }
    
  } catch (error) {
    console.log('💥 Setup failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the setup
setupChatAttachmentsBucket();