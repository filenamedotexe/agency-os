// Create users properly through Supabase Admin API
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://lfqnpszawjpcydobpxul.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcW5wc3phd2pwY3lkb2JweHVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxMTg0MCwiZXhwIjoyMDcwMjg3ODQwfQ.nXx3ntxw6mrLfSWyC4qTrtYLo4lOqToSmZMrjB7YVjc'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const users = [
  {
    email: 'admin@agencyos.dev',
    password: 'password123',
    user_metadata: {
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    }
  },
  {
    email: 'john@agencyos.dev',
    password: 'password123',
    user_metadata: {
      first_name: 'John',
      last_name: 'Smith',
      role: 'team_member'
    }
  },
  {
    email: 'sarah@agencyos.dev',
    password: 'password123',
    user_metadata: {
      first_name: 'Sarah',
      last_name: 'Johnson',
      role: 'team_member'
    }
  },
  {
    email: 'client1@acme.com',
    password: 'password123',
    user_metadata: {
      first_name: 'Alice',
      last_name: 'Brown',
      role: 'client'
    }
  },
  {
    email: 'client2@techcorp.com',
    password: 'password123',
    user_metadata: {
      first_name: 'Bob',
      last_name: 'Wilson',
      role: 'client'
    }
  }
]

async function createUsers() {
  console.log('Creating users through Supabase Admin API...')
  
  for (const userData of users) {
    try {
      // First, delete existing user if exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === userData.email)
      
      if (existingUser) {
        console.log(`Deleting existing user: ${userData.email}`)
        await supabase.auth.admin.deleteUser(existingUser.id)
      }
      
      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: userData.user_metadata
      })
      
      if (error) {
        console.error(`Error creating ${userData.email}:`, error.message)
      } else {
        console.log(`✓ Created user: ${userData.email} (${userData.user_metadata.role})`)
        
        // Update profile with additional data if client
        if (userData.user_metadata.role === 'client' && data.user) {
          const clientData = {
            profile_id: data.user.id,
            company_name: userData.email.includes('acme') ? 'Acme Corporation' :
                         userData.email.includes('techcorp') ? 'TechCorp Solutions' : 
                         'Client Company',
            phone: '+1 (555) 123-4567',
            industry: 'Technology'
          }
          
          const { error: profileError } = await supabase
            .from('client_profiles')
            .upsert(clientData)
          
          if (profileError) {
            console.error(`Error creating client profile for ${userData.email}:`, profileError.message)
          }
        }
      }
    } catch (err) {
      console.error(`Unexpected error for ${userData.email}:`, err)
    }
  }
  
  console.log('\n✅ User creation complete!')
  console.log('\nTest accounts (all use password: password123):')
  console.log('Admin:    admin@agencyos.dev')
  console.log('Team:     john@agencyos.dev')
  console.log('Client:   client1@acme.com')
}

createUsers()