#!/usr/bin/env node

/**
 * CREATE KNOWLEDGE COLLECTIONS
 * Simple script to create sample knowledge collections and resources
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createKnowledgeCollections() {
  console.log('📚 Creating Knowledge Collections...')
  
  try {
    // Get admin user
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'admin@demo.com')
      .single()
    
    if (!adminUser) {
      console.error('❌ Admin user not found')
      return
    }
    
    console.log('✅ Admin user found')
    
    // Create collections
    const { data: collections, error: collectionsError } = await supabase
      .from('knowledge_collections')
      .insert([
        {
          name: 'Getting Started',
          description: 'Essential resources for new clients and team members',
          icon: 'folder',
          color: 'blue',
          visibility: 'public',
          created_by: adminUser.id
        },
        {
          name: 'Project Templates',
          description: 'Reusable templates and best practices for projects',
          icon: 'file',
          color: 'green',
          visibility: 'team',
          created_by: adminUser.id
        },
        {
          name: 'Client Resources',
          description: 'Resources and documentation shared with clients',
          icon: 'link',
          color: 'purple',
          visibility: 'public',
          created_by: adminUser.id
        }
      ])
      .select()
    
    if (collectionsError) {
      console.error('❌ Error creating collections:', collectionsError.message)
      return
    }
    
    console.log(`✅ Created ${collections.length} collections`)
    
    // Create sample resources
    if (collections && collections.length > 0) {
      const { data: resources, error: resourcesError } = await supabase
        .from('knowledge_resources')
        .insert([
          {
            collection_id: collections[0].id,
            title: 'Welcome Guide',
            description: 'Getting started with AgencyOS platform',
            content: 'Welcome to AgencyOS! This comprehensive guide will help you understand the key features...',
            resource_type: 'note',
            created_by: adminUser.id
          },
          {
            collection_id: collections[0].id,
            title: 'Platform Overview Video',
            description: 'Video walkthrough of main features',
            url: 'https://example.com/video',
            resource_type: 'link',
            created_by: adminUser.id
          },
          {
            collection_id: collections[1].id,
            title: 'Website Development Template',
            description: 'Standard website project workflow',
            content: 'This template covers the complete website development lifecycle from discovery to launch...',
            resource_type: 'note',
            created_by: adminUser.id
          },
          {
            collection_id: collections[2].id,
            title: 'Client Onboarding Checklist',
            description: 'Steps for successful client onboarding',
            content: 'Follow these steps to ensure smooth client onboarding...',
            resource_type: 'note',
            created_by: adminUser.id
          }
        ])
        .select()
      
      if (resourcesError) {
        console.error('❌ Error creating resources:', resourcesError.message)
      } else {
        console.log(`✅ Created ${resources.length} sample resources`)
      }
    }
    
    console.log('\n🎉 Knowledge base setup complete!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

createKnowledgeCollections()
  .then(() => console.log('✅ Knowledge collections created!'))
  .catch(console.error)