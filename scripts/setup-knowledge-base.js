#!/usr/bin/env node

/**
 * SETUP KNOWLEDGE BASE
 * Create knowledge collections and resources tables with sample data
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupKnowledgeBase() {
  console.log('📚 Setting up Knowledge Base...\n')
  
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['knowledge_collections', 'knowledge_resources'])
    
    if (tablesError) {
      console.log('⚠️  Cannot check existing tables, proceeding with creation...')
    }
    
    // Create knowledge_collections table
    console.log('🔧 Creating knowledge_collections table...')
    const { error: collectionsError } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS knowledge_collections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50) DEFAULT 'folder',
        color VARCHAR(50) DEFAULT 'blue',
        visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'team', 'private')),
        created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `
    
    if (collectionsError) {
      console.log('⚠️  Collections table may already exist:', collectionsError.message)
    } else {
      console.log('✅ Knowledge collections table created')
    }
    
    // Create knowledge_resources table
    console.log('🔧 Creating knowledge_resources table...')
    const { error: resourcesError } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS knowledge_resources (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        collection_id UUID NOT NULL REFERENCES knowledge_collections(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT,
        url TEXT,
        file_url TEXT,
        file_name VARCHAR(255),
        file_size INTEGER,
        file_type VARCHAR(100),
        resource_type VARCHAR(20) DEFAULT 'note' CHECK (resource_type IN ('link', 'file', 'note')),
        tags TEXT[],
        created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `
    
    if (resourcesError) {
      console.log('⚠️  Resources table may already exist:', resourcesError.message)
    } else {
      console.log('✅ Knowledge resources table created')
    }
    
    // Enable RLS
    console.log('🔒 Enabling Row Level Security...')
    await supabase.sql`ALTER TABLE knowledge_collections ENABLE ROW LEVEL SECURITY;`
    await supabase.sql`ALTER TABLE knowledge_resources ENABLE ROW LEVEL SECURITY;`
    
    // Get admin user for seeding
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'admin@demo.com')
      .single()
    
    if (adminUser) {
      console.log('📋 Creating sample collections...')
      
      // Create sample collections
      const { data: collections, error: seedError } = await supabase
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
            description: 'Reusable templates and best practices for common projects',
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
      
      if (seedError) {
        console.log('⚠️  Collections may already exist:', seedError.message)
      } else {
        console.log(`✅ Created ${collections.length} sample collections`)
        
        // Create sample resources
        if (collections && collections.length > 0) {
          const { data: resources, error: resourceSeedError } = await supabase
            .from('knowledge_resources')
            .insert([
              {
                collection_id: collections[0].id,
                title: 'Welcome Guide',
                description: 'Getting started with AgencyOS platform',
                content: 'Welcome to AgencyOS! This guide will help you understand the key features and how to get the most out of the platform...',
                resource_type: 'note',
                created_by: adminUser.id
              },
              {
                collection_id: collections[0].id,
                title: 'Platform Overview',
                description: 'Complete overview of platform capabilities',
                url: 'https://docs.example.com/overview',
                resource_type: 'link',
                created_by: adminUser.id
              },
              {
                collection_id: collections[1].id,
                title: 'Website Development Template',
                description: 'Standard website project template with milestones',
                content: 'This template covers the complete website development lifecycle...',
                resource_type: 'note',
                created_by: adminUser.id
              }
            ])
            .select()
          
          if (resourceSeedError) {
            console.log('⚠️  Resources may already exist:', resourceSeedError.message)
          } else {
            console.log(`✅ Created ${resources.length} sample resources`)
          }
        }
      }
    }
    
    console.log('\n🎉 Knowledge Base setup complete!')
    console.log('📋 You can now visit /knowledge to see the collections')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupKnowledgeBase()
  .then(() => {
    console.log('✅ Knowledge base setup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Knowledge base setup failed:', error)
    process.exit(1)
  })