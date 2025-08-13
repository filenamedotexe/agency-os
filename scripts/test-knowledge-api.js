#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Import server actions (simulate)
async function testCreateCollection(data) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Use real admin user
  const adminUser = { id: 'f4c7d2a7-4b94-4ea8-951c-49a7130ec1d7' };
  
  const { data: collection, error } = await supabase
    .from('collections')
    .insert({
      ...data,
      created_by: adminUser.id
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { collection };
}

async function testCreateResource(data) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get next order_index
  const { data: lastResource } = await supabase
    .from('resources')
    .select('order_index')
    .eq('collection_id', data.collection_id)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const order_index = (lastResource?.order_index ?? -1) + 1;

  const { data: resource, error } = await supabase
    .from('resources')
    .insert({
      ...data,
      order_index,
      created_by: 'f4c7d2a7-4b94-4ea8-951c-49a7130ec1d7'
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { resource };
}

async function testKnowledgeAPI() {
  console.log('🧪 Testing Knowledge Hub Backend API');
  console.log('=====================================\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Test 1: Create a collection
    console.log('📚 Test 1: Creating Collection');
    const testCollection = {
      name: 'API Test Collection',
      description: 'Testing the Knowledge Hub API',
      icon: 'folder',
      color: 'blue',
      visibility: 'clients'
    };

    const { collection, error: collectionError } = await testCreateCollection(testCollection);

    if (collectionError) {
      console.error('❌ Failed to create collection:', collectionError);
      return false;
    }

    console.log('✅ Collection created:', collection.id);

    // Test 2: Create a link resource
    console.log('\n📄 Test 2: Creating Link Resource');
    const testLinkResource = {
      collection_id: collection.id,
      title: 'Test Documentation Link',
      description: 'External documentation link',
      type: 'link',
      content_url: 'https://docs.example.com/test'
    };

    const { resource: linkResource, error: linkError } = await testCreateResource(testLinkResource);

    if (linkError) {
      console.error('❌ Failed to create link resource:', linkError);
      return false;
    }

    console.log('✅ Link resource created:', linkResource.id);

    // Test 3: Create a file resource (simulate)
    console.log('\n📁 Test 3: Creating File Resource');
    const testFileResource = {
      collection_id: collection.id,
      title: 'Test PDF Document',
      description: 'Sample PDF file',
      type: 'document',
      content_url: 'https://example.com/sample.pdf',
      file_name: 'sample.pdf',
      file_size: 1024000,
      mime_type: 'application/pdf'
    };

    const { resource: fileResource, error: fileError } = await testCreateResource(testFileResource);

    if (fileError) {
      console.error('❌ Failed to create file resource:', fileError);
      return false;
    }

    console.log('✅ File resource created:', fileResource.id);

    // Test 4: Get collections
    console.log('\n📋 Test 4: Retrieving Collections');
    const { data: collections, error: getError } = await supabase
      .from('collections')
      .select(`
        *,
        resources (count)
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (getError) {
      console.error('❌ Failed to retrieve collections:', getError.message);
      return false;
    }

    console.log(`✅ Retrieved ${collections.length} collections`);

    // Test 5: Get single collection with resources
    console.log('\n📖 Test 5: Retrieving Collection with Resources');
    const { data: detailedCollection, error: detailError } = await supabase
      .from('collections')
      .select(`
        *,
        resources (*)
      `)
      .eq('id', collection.id)
      .eq('is_active', true)
      .single();

    if (detailError) {
      console.error('❌ Failed to retrieve collection details:', detailError.message);
      return false;
    }

    console.log(`✅ Retrieved collection with ${detailedCollection.resources.length} resources`);

    // Test 6: Track resource access
    console.log('\n👁️ Test 6: Tracking Resource Access');
    const { error: accessError } = await supabase
      .from('resource_access')
      .upsert({
        user_id: 'f102101c-c20e-4211-908f-c7a9b4f50a45',
        resource_id: linkResource.id,
        collection_id: collection.id,
        accessed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,resource_id'
      });

    if (accessError) {
      console.error('❌ Failed to track access:', accessError.message);
      return false;
    }

    console.log('✅ Resource access tracked');

    // Test 7: Storage bucket access
    console.log('\n🗄️ Test 7: Testing Storage Bucket');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('❌ Failed to access storage:', bucketError.message);
      return false;
    }

    const knowledgeHub = buckets?.find(b => b.name === 'knowledge-hub');
    if (!knowledgeHub) {
      console.error('❌ Knowledge hub bucket not found');
      return false;
    }

    console.log('✅ Storage bucket accessible');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete resources
    await supabase.from('resources').delete().eq('collection_id', collection.id);
    await supabase.from('resource_access').delete().eq('collection_id', collection.id);
    
    // Delete collection
    await supabase.from('collections').delete().eq('id', collection.id);
    
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All Knowledge Hub API tests passed!');
    console.log('Backend is ready for frontend integration.');
    
    return true;

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    return false;
  }
}

// Only run if called directly
if (require.main === module) {
  testKnowledgeAPI()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test failed:', err);
      process.exit(1);
    });
}

module.exports = { testKnowledgeAPI };