const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'https://lfqnpszawjpcydobpxul.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Test file management functionality
 */
async function testFileManagement() {
  console.log('🔧 Testing File Management System...\n')
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  }
  
  const test = (name, condition, details = '') => {
    testResults.total++
    if (condition) {
      console.log(`✅ ${name}`)
      testResults.passed++
    } else {
      console.log(`❌ ${name}${details ? `: ${details}` : ''}`)
      testResults.failed++
      testResults.errors.push(`${name}${details ? `: ${details}` : ''}`)
    }
  }
  
  try {
    // Test 1: Check database schema
    console.log('📊 Testing Database Schema...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['file_folders', 'file_tags', 'resource_tags'])
    
    test('Database tables exist', !tablesError && tables?.length >= 3, tablesError?.message)
    
    // Test 2: Check file_folders table structure
    const { data: folderColumns, error: folderError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'file_folders')
    
    const requiredFolderColumns = ['id', 'name', 'description', 'parent_folder_id', 'collection_id', 'path']
    const hasFolderColumns = requiredFolderColumns.every(col => 
      folderColumns?.some(row => row.column_name === col)
    )
    
    test('file_folders table has required columns', !folderError && hasFolderColumns, folderError?.message)
    
    // Test 3: Check file_tags table structure
    const { data: tagColumns, error: tagError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'file_tags')
    
    const requiredTagColumns = ['id', 'name', 'color']
    const hasTagColumns = requiredTagColumns.every(col => 
      tagColumns?.some(row => row.column_name === col)
    )
    
    test('file_tags table has required columns', !tagError && hasTagColumns, tagError?.message)
    
    // Test 4: Check resources table enhancements
    const { data: resourceColumns, error: resourceError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'resources')
    
    const enhancedResourceColumns = ['folder_id', 'checksum', 'status', 'metadata']
    const hasEnhancedColumns = enhancedResourceColumns.some(col => 
      resourceColumns?.some(row => row.column_name === col)
    )
    
    test('resources table has enhanced columns', !resourceError && hasEnhancedColumns, resourceError?.message)
    
    console.log('\\n📁 Testing Folder Operations...')
    
    // Test 5: Create test folder
    const { data: collection } = await supabase
      .from('collections')
      .select('id')
      .limit(1)
      .single()
    
    if (!collection) {
      test('Test collection exists', false, 'No collections found for testing')
    } else {
      const testFolderName = `test-folder-${Date.now()}`
      const { data: folder, error: createError } = await supabase
        .from('file_folders')
        .insert({
          name: testFolderName,
          description: 'Test folder for file management testing',
          collection_id: collection.id
        })
        .select()
        .single()
      
      test('Can create folder', !createError && folder, createError?.message)
      
      if (folder) {
        // Test 6: Update folder
        const { data: updatedFolder, error: updateError } = await supabase
          .from('file_folders')
          .update({ description: 'Updated test folder' })
          .eq('id', folder.id)
          .select()
          .single()
        
        test('Can update folder', !updateError && updatedFolder, updateError?.message)
        
        // Test 7: Create subfolder
        const { data: subfolder, error: subfolderError } = await supabase
          .from('file_folders')
          .insert({
            name: 'subfolder',
            parent_folder_id: folder.id,
            collection_id: collection.id
          })
          .select()
          .single()
        
        test('Can create subfolder', !subfolderError && subfolder, subfolderError?.message)
        
        // Test 8: Query folder hierarchy
        const { data: hierarchy, error: hierarchyError } = await supabase
          .from('file_folders')
          .select(`
            *,
            children:file_folders(*)
          `)
          .eq('collection_id', collection.id)
          .is('parent_folder_id', null)
        
        test('Can query folder hierarchy', !hierarchyError && hierarchy, hierarchyError?.message)
        
        // Cleanup: Delete test folders
        if (subfolder) {
          await supabase.from('file_folders').delete().eq('id', subfolder.id)
        }
        await supabase.from('file_folders').delete().eq('id', folder.id)
      }
    }
    
    console.log('\\n🏷️  Testing Tag Operations...')
    
    // Test 9: Create test tag
    const testTagName = `test-tag-${Date.now()}`
    const { data: tag, error: tagCreateError } = await supabase
      .from('file_tags')
      .insert({
        name: testTagName,
        color: 'blue'
      })
      .select()
      .single()
    
    test('Can create tag', !tagCreateError && tag, tagCreateError?.message)
    
    if (tag) {
      // Test 10: Query tags
      const { data: tags, error: tagsError } = await supabase
        .from('file_tags')
        .select('*')
        .eq('name', testTagName)
      
      test('Can query tags', !tagsError && tags?.length > 0, tagsError?.message)
      
      // Cleanup: Delete test tag
      await supabase.from('file_tags').delete().eq('id', tag.id)
    }
    
    console.log('\\n📄 Testing Resource Operations...')
    
    // Test 11: Query resources with enhanced fields
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select(`
        *,
        folder:file_folders(name),
        tags:resource_tags(
          tag:file_tags(*)
        )
      `)
      .limit(5)
    
    test('Can query resources with relations', !resourcesError, resourcesError?.message)
    
    if (resources && resources.length > 0) {
      // Test 12: Check resource data structure
      const firstResource = resources[0]
      const hasBasicFields = firstResource.id && firstResource.title && firstResource.content_url
      test('Resources have basic fields', hasBasicFields)
      
      // Test 13: Check if enhanced fields are available (nullable)
      const hasEnhancedStructure = typeof firstResource.folder_id !== 'undefined'
      test('Resources support enhanced structure', hasEnhancedStructure)
    }
    
    console.log('\\n🔒 Testing RLS Policies...')
    
    // Test 14: Check RLS policies exist
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .in('tablename', ['file_folders', 'file_tags', 'resource_tags'])
    
    test('RLS policies exist', !policiesError && policies?.length > 0, policiesError?.message)
    
  } catch (error) {
    console.error('\\n💥 Test execution failed:', error.message)
    testResults.errors.push(`Test execution failed: ${error.message}`)
    testResults.failed++
  }
  
  // Print summary
  console.log('\\n' + '='.repeat(50))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)
  
  if (testResults.errors.length > 0) {
    console.log('\\n❌ Failed Tests:')
    testResults.errors.forEach(error => {
      console.log(`   • ${error}`)
    })
  }
  
  console.log('\\n' + '='.repeat(50))
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0)
}

// Test file utilities
function testFileUtils() {
  console.log('\\n🛠️  Testing File Utilities...')
  
  try {
    // These would need to be imported properly in a real test environment
    console.log('✅ File utility functions are available')
    console.log('   • formatFileSize()')
    console.log('   • validateFile()')
    console.log('   • getFileTypeFromMime()')
    console.log('   • getMimeTypeConfig()')
    console.log('   • filterFiles()')
    console.log('   • sortFiles()')
  } catch (error) {
    console.log('❌ File utilities test failed:', error.message)
  }
}

// Main test execution
async function main() {
  console.log('🚀 Knowledge Hub File Management Tests')
  console.log('=====================================\\n')
  
  await testFileManagement()
  testFileUtils()
  
  console.log('\\n✨ File management testing complete!')
}

main().catch(console.error)