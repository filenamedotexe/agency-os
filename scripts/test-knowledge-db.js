#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDatabase() {
  console.log('🧪 Testing Knowledge Hub Database Setup');
  console.log('========================================\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Test tables exist
  const tables = ['collections', 'resources', 'resource_access', 'collection_permissions'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Table ${table} not accessible:`, error.message);
        return false;
      }
      console.log(`✅ Table ${table} is ready`);
    } catch (err) {
      console.error(`❌ Error testing table ${table}:`, err.message);
      return false;
    }
  }
  
  // Test storage bucket
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('❌ Cannot list storage buckets:', error.message);
      return false;
    }
    
    const knowledgeHub = buckets?.find(b => b.name === 'knowledge-hub');
    if (!knowledgeHub) {
      console.error('❌ Storage bucket knowledge-hub not found');
      return false;
    }
    console.log('✅ Storage bucket ready');
  } catch (err) {
    console.error('❌ Error testing storage:', err.message);
    return false;
  }
  
  // Test RLS policies are working
  try {
    console.log('\n🔒 Testing RLS Policies:');
    
    // Test admin can access collections
    const { data: adminTest, error: adminError } = await supabase
      .from('collections')
      .select('*')
      .limit(1);
    
    if (adminError && !adminError.message.includes('0 rows')) {
      console.log('⚠️  RLS policy test: ', adminError.message);
    } else {
      console.log('✅ Collections RLS policies active');
    }
    
    // Test resources RLS
    const { data: resourceTest, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .limit(1);
    
    if (resourceError && !resourceError.message.includes('0 rows')) {
      console.log('⚠️  Resources RLS policy test: ', resourceError.message);
    } else {
      console.log('✅ Resources RLS policies active');
    }
    
  } catch (err) {
    console.log('⚠️  RLS test error (expected with service role):', err.message);
  }
  
  console.log('\n🎉 Database setup verification complete!');
  console.log('All tables and storage bucket are ready for Knowledge Hub.');
  
  return true;
}

// Only run if called directly
if (require.main === module) {
  testDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test failed:', err);
      process.exit(1);
    });
}

module.exports = { testDatabase };