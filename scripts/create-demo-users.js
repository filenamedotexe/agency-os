#!/usr/bin/env node

/**
 * Create Demo Users for AgencyOS
 * Creates authenticated users with easy passwords (password123)
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('👥 Creating Demo Users for AgencyOS');
console.log('===================================');

const DEMO_USERS = [
  {
    email: 'admin@demo.com',
    password: 'password123',
    role: 'admin',
    first_name: 'Alex',
    last_name: 'Admin',
    display: 'Admin User'
  },
  {
    email: 'team@demo.com', 
    password: 'password123',
    role: 'team_member',
    first_name: 'Taylor',
    last_name: 'Team',
    display: 'Team Member'
  },
  {
    email: 'sarah@acmecorp.com',
    password: 'password123', 
    role: 'client',
    first_name: 'Sarah',
    last_name: 'Johnson',
    display: 'Client - Acme Corp',
    company_name: 'Acme Corporation',
    industry: 'Technology',
    company_size: '50-100 employees',
    annual_revenue: '$5M-$10M',
    website: 'https://acmecorp.com',
    phone: '+1 (555) 123-4567'
  },
  {
    email: 'mike@techstartup.co',
    password: 'password123',
    role: 'client', 
    first_name: 'Mike',
    last_name: 'Chen',
    display: 'Client - TechStartup',
    company_name: 'TechStartup Co',
    industry: 'Software',
    company_size: '10-50 employees', 
    annual_revenue: '$1M-$5M',
    website: 'https://techstartup.co',
    phone: '+1 (555) 987-6543'
  },
  {
    email: 'lisa@retailplus.com',
    password: 'password123',
    role: 'client',
    first_name: 'Lisa',
    last_name: 'Rodriguez',
    display: 'Client - RetailPlus',
    company_name: 'RetailPlus Inc',
    industry: 'Retail',
    company_size: '100-500 employees',
    annual_revenue: '$10M-$50M', 
    website: 'https://retailplus.com',
    phone: '+1 (555) 456-7890'
  }
];

async function createDemoUsers() {
  console.log(`\n🔧 Creating ${DEMO_USERS.length} demo users...\n`);
  
  for (const userData of DEMO_USERS) {
    try {
      console.log(`Creating: ${userData.display} (${userData.email})`);
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      });
      
      if (authError && !authError.message.includes('already been registered')) {
        console.log(`❌ Auth error for ${userData.email}: ${authError.message}`);
        continue;
      }
      
      if (authError?.message.includes('already been registered')) {
        console.log(`ℹ️  User already exists: ${userData.email}`);
        // Get existing user ID
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === userData.email);
        if (user) {
          await updateUserProfile(user.id, userData);
        }
        continue;
      }
      
      if (authData?.user) {
        console.log(`✅ Created auth user: ${userData.email}`);
        await updateUserProfile(authData.user.id, userData);
      }
      
    } catch (error) {
      console.log(`❌ Error creating ${userData.email}: ${error.message}`);
    }
  }
}

async function updateUserProfile(userId, userData) {
  try {
    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role
      });
      
    if (profileError) {
      console.log(`⚠️  Profile error: ${profileError.message}`);
      return;
    }
    
    console.log(`  ✅ Created profile`);
    
    // Create client profile if needed
    if (userData.role === 'client') {
      const { error: clientError } = await supabase
        .from('client_profiles')
        .upsert({
          id: userId,
          company_name: userData.company_name,
          industry: userData.industry,
          company_size: userData.company_size,
          annual_revenue: userData.annual_revenue,
          website: userData.website,
          phone: userData.phone
        });
        
      if (clientError) {
        console.log(`  ⚠️  Client profile error: ${clientError.message}`);
      } else {
        console.log(`  ✅ Created client profile`);
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Profile error: ${error.message}`);
  }
}

async function displayUserList() {
  console.log('\n👥 DEMO USERS CREATED:');
  console.log('=====================');
  console.log('All users have password: password123\n');
  
  DEMO_USERS.forEach((user, index) => {
    console.log(`${index + 1}. ${user.display}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    if (user.company_name) {
      console.log(`   Company: ${user.company_name}`);
    }
    console.log('');
  });
  
  console.log('🔐 LOGIN CREDENTIALS:');
  console.log('====================');
  console.log('Password for ALL users: password123');
  console.log('');
  console.log('Admin Access:  admin@demo.com');
  console.log('Team Access:   team@demo.com');
  console.log('Client Access: sarah@acmecorp.com (or any client email)');
}

// Run the setup
createDemoUsers()
  .then(displayUserList)
  .catch(console.error);