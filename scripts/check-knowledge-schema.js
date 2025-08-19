#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('🔍 Checking database schema...')
  
  try {
    // List all tables
    const { data: tables, error } = await supabase.rpc('list_tables')
    
    if (error) {
      console.log('Using alternative method...')
      
      // Try alternative approach
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
      console.log('✅ Database connection working')
      
      // Check specific table names that might exist
      const tablesToCheck = ['collections', 'resources', 'knowledge_collections', 'knowledge_resources']
      
      for (const tableName of tablesToCheck) {
        try {
          const { data, error } = await supabase.from(tableName).select('id').limit(1)
          if (!error) {
            console.log(`✅ Table '${tableName}' exists`)
          }
        } catch (e) {
          console.log(`❌ Table '${tableName}' does not exist`)
        }
      }
    } else {
      console.log('📊 Available tables:')
      tables.forEach(table => console.log(`  - ${table.table_name}`))
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message)
  }
}

checkSchema()