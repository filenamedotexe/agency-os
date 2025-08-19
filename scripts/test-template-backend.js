#!/usr/bin/env node

/**
 * TEST TEMPLATE BACKEND ACTIONS
 * Direct test of backend functions to see if templates are loading
 */

// Import the backend action directly
const path = require('path')
process.env.NODE_PATH = path.resolve(__dirname, '..')
require('module')._initPaths()

console.log('🧪 Testing Template Backend Actions...')

async function testBackend() {
  try {
    // Test direct database query
    const { createClient } = require('@/shared/lib/supabase/server')
    
    const supabase = await createClient()
    
    // Direct query to check templates
    const { data: templates, error } = await supabase
      .from('service_templates')
      .select('*')
      .limit(5)
    
    console.log('📊 Direct DB query result:')
    console.log('Templates:', templates?.length || 0)
    console.log('Error:', error?.message || 'none')
    
    if (templates && templates.length > 0) {
      console.log('✅ Templates exist in database')
      console.log('📋 Sample template:', {
        name: templates[0].name,
        created_by: templates[0].created_by,
        is_default: templates[0].is_default
      })
    }
    
    // Test template summary view
    const { data: summary, error: summaryError } = await supabase
      .from('template_summary')
      .select('*')
      .limit(3)
    
    console.log('\n📊 Template summary view:')
    console.log('Templates:', summary?.length || 0)
    console.log('Error:', summaryError?.message || 'none')
    
    if (summary && summary.length > 0) {
      console.log('✅ Template summary view working')
      summary.forEach(t => {
        console.log(`📋 ${t.name}: ${t.milestone_count} milestones, ${t.task_count} tasks`)
      })
    }
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testBackend()
  .then(() => console.log('✅ Backend test completed'))
  .catch(console.error)