#!/usr/bin/env node

/**
 * CREATE SAMPLE COLLECTIONS
 * Create sample knowledge collections using existing tables
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSampleCollections() {
  console.log('📚 Creating Sample Knowledge Collections...')
  
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
    
    // Create collections in the existing 'collections' table
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .insert([
        {
          name: 'Getting Started Guide',
          description: 'Essential resources for new clients and team members to get up to speed quickly',
          icon: 'folder',
          color: 'blue',
          visibility: 'public',
          created_by: adminUser.id
        },
        {
          name: 'Project Templates & Best Practices',
          description: 'Proven templates and methodologies for delivering successful projects',
          icon: 'file',
          color: 'green',
          visibility: 'team',
          created_by: adminUser.id
        },
        {
          name: 'Client Resources',
          description: 'Helpful documentation and resources we share with our clients',
          icon: 'link',
          color: 'purple',
          visibility: 'public',
          created_by: adminUser.id
        },
        {
          name: 'Team Internal Docs',
          description: 'Internal documentation, processes, and team resources',
          icon: 'folder',
          color: 'orange',
          visibility: 'team',
          created_by: adminUser.id
        }
      ])
      .select()
    
    if (collectionsError) {
      console.error('❌ Error creating collections:', collectionsError.message)
      return
    }
    
    console.log(`✅ Created ${collections.length} sample collections`)
    
    // Create sample resources for each collection
    if (collections && collections.length > 0) {
      const sampleResources = [
        // Getting Started collection
        {
          collection_id: collections[0].id,
          title: 'Welcome to AgencyOS',
          description: 'Your comprehensive guide to getting started',
          content: 'Welcome to AgencyOS! This platform helps you manage projects, communicate with clients, and organize resources efficiently...',
          resource_type: 'note',
          tags: ['welcome', 'getting-started'],
          created_by: adminUser.id
        },
        {
          collection_id: collections[0].id,
          title: 'Platform Overview Video',
          description: '5-minute walkthrough of key features',
          url: 'https://example.com/overview-video',
          resource_type: 'link',
          tags: ['video', 'overview'],
          created_by: adminUser.id
        },
        // Project Templates collection
        {
          collection_id: collections[1].id,
          title: 'Website Development Workflow',
          description: 'Our proven process for website projects',
          content: 'This template covers discovery, design, development, testing, and launch phases...',
          resource_type: 'note',
          tags: ['template', 'website', 'workflow'],
          created_by: adminUser.id
        },
        {
          collection_id: collections[1].id,
          title: 'Marketing Campaign Template',
          description: 'Template for digital marketing campaigns',
          content: 'Follow this template for successful marketing campaign delivery...',
          resource_type: 'note',
          tags: ['template', 'marketing'],
          created_by: adminUser.id
        },
        // Client Resources collection
        {
          collection_id: collections[2].id,
          title: 'Client Onboarding Checklist',
          description: 'Everything clients need to know to get started',
          content: 'Welcome! Here\'s what you need to know about working with our team...',
          resource_type: 'note',
          tags: ['onboarding', 'client'],
          created_by: adminUser.id
        },
        {
          collection_id: collections[2].id,
          title: 'Project Communication Guidelines',
          description: 'How we communicate during projects',
          content: 'We believe in clear, regular communication throughout your project...',
          resource_type: 'note',
          tags: ['communication', 'guidelines'],
          created_by: adminUser.id
        },
        // Team Internal collection
        {
          collection_id: collections[3].id,
          title: 'Team Processes & Standards',
          description: 'Internal team processes and quality standards',
          content: 'Our internal processes ensure consistent, high-quality delivery...',
          resource_type: 'note',
          tags: ['internal', 'processes'],
          created_by: adminUser.id
        }
      ]
      
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .insert(sampleResources)
        .select()
      
      if (resourcesError) {
        console.error('❌ Error creating resources:', resourcesError.message)
      } else {
        console.log(`✅ Created ${resources.length} sample resources`)
        
        // Show breakdown
        collections.forEach((collection, index) => {
          const collectionResources = resources.filter(r => r.collection_id === collection.id)
          console.log(`📁 ${collection.name}: ${collectionResources.length} resources`)
        })
      }
    }
    
    console.log('\n🎉 Sample knowledge collections created!')
    console.log('📋 Visit /knowledge to see the new collections with accurate resource counts')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

createSampleCollections()
  .then(() => console.log('✅ Sample collections created!'))
  .catch(console.error)