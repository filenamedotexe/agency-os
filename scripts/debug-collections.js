#!/usr/bin/env node

// Test the collections query directly
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lfqnpszawjpcydobpxul.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcW5wc3phd2pwY3lkb2JweHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTE4NDAsImV4cCI6MjA3MDI4Nzg0MH0.b4A5oq-iGVtprAu9K1yfquH8-DiVd-7ytX_Cp6QojDo';

async function debugCollections() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('🔍 DEBUGGING COLLECTIONS QUERY');
  console.log('===============================\n');
  
  // Test basic collections query
  console.log('1️⃣ Basic collections query:');
  const { data: basicCollections, error: basicError } = await supabase
    .from('collections')
    .select('*')
    .eq('is_active', true);
  
  if (basicError) {
    console.log('❌ Basic query error:', basicError.message);
  } else {
    console.log(`✅ Found ${basicCollections.length} active collections:`);
    basicCollections.forEach(col => {
      console.log(`   - ${col.name} (${col.visibility})`);
    });
  }
  
  // Test with resources count (original query)
  console.log('\n2️⃣ Query with resources (inner join):');
  const { data: innerCollections, error: innerError } = await supabase
    .from('collections')
    .select(`
      *,
      resources!inner (count)
    `)
    .eq('is_active', true);
  
  if (innerError) {
    console.log('❌ Inner join query error:', innerError.message);
  } else {
    console.log(`✅ Found ${innerCollections.length} collections with resources:`);
    innerCollections.forEach(col => {
      console.log(`   - ${col.name} (${col.resources[0]?.count || 0} resources)`);
    });
  }
  
  // Test with resources count (left join - fixed)
  console.log('\n3️⃣ Query with resources (left join):');
  const { data: leftCollections, error: leftError } = await supabase
    .from('collections')
    .select(`
      *,
      resources (count)
    `)
    .eq('is_active', true);
  
  if (leftError) {
    console.log('❌ Left join query error:', leftError.message);
  } else {
    console.log(`✅ Found ${leftCollections.length} collections (left join):`);
    leftCollections.forEach(col => {
      console.log(`   - ${col.name} (${col.resources[0]?.count || 0} resources)`);
    });
  }
  
  // Test with authentication (simulate admin user)
  console.log('\n4️⃣ Testing with admin session:');
  const adminId = 'f4c7d2a7-4b94-4ea8-951c-49a7130ec1d7'; // admin@demo.com ID
  
  // This won't work without proper auth, but let's try
  const { data: authCollections, error: authError } = await supabase
    .from('collections')
    .select(`
      *,
      resources (count)
    `)
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  
  if (authError) {
    console.log('❌ Auth query error:', authError.message);
  } else {
    console.log(`✅ Found ${authCollections.length} collections with auth:`);
    authCollections.forEach(col => {
      console.log(`   - ${col.name} (order: ${col.order_index})`);
    });
  }
}

debugCollections()
  .then(() => console.log('\n🏁 Debug completed'))
  .catch(err => console.error('Debug failed:', err));