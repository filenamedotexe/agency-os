const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lfqnpszawjpcydobpxul.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcW5wc3phd2pwY3lkb2JweHVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxMTg0MCwiZXhwIjoyMDcwMjg3ODQwfQ.nXx3ntxw6mrLfSWyC4qTrtYLo4lOqToSmZMrjB7YVjc'
);

async function createTestServices() {
  console.log('🚀 Creating test services for Phase 4...\n');
  
  try {
    // Get a client user
    const { data: clients, error: clientError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .limit(1);
    
    if (clientError || !clients || clients.length === 0) {
      console.error('No client users found. Creating test client...');
      
      // Create a test client first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'testclient@phase4.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Client Phase4',
          role: 'client'
        }
      });
      
      if (authError) throw authError;
      
      // Wait for profile to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the created client
      const { data: newClient } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      clients[0] = newClient;
    }
    
    const clientId = clients[0].id;
    console.log('Using client:', clients[0].full_name || clients[0].email);
    
    // Create test services
    const services = [
      {
        name: 'Website Redesign Project',
        description: 'Complete overhaul of the corporate website with modern design and improved UX',
        client_id: clientId,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        budget: 50000
      },
      {
        name: 'Mobile App Development',
        description: 'Native iOS and Android app for customer engagement',
        client_id: clientId,
        status: 'planning',
        start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days from now
        budget: 120000
      },
      {
        name: 'Marketing Campaign Q1',
        description: 'Q1 digital marketing campaign across all channels',
        client_id: clientId,
        status: 'active',
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        budget: 25000
      }
    ];
    
    // Insert services
    const { data: insertedServices, error: insertError } = await supabase
      .from('services')
      .insert(services)
      .select();
    
    if (insertError) throw insertError;
    
    console.log(`✅ Created ${insertedServices.length} test services`);
    
    // Create milestones for the first service
    const firstServiceId = insertedServices[0].id;
    
    const milestones = [
      {
        service_id: firstServiceId,
        name: 'Discovery & Research',
        description: 'User research, competitive analysis, and requirements gathering',
        status: 'completed',
        position: 0,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString()
      },
      {
        service_id: firstServiceId,
        name: 'Design Phase',
        description: 'Wireframes, mockups, and design system creation',
        status: 'in_progress',
        position: 1,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        service_id: firstServiceId,
        name: 'Development',
        description: 'Frontend and backend development',
        status: 'upcoming',
        position: 2,
        due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        service_id: firstServiceId,
        name: 'Testing & Launch',
        description: 'QA, UAT, and production deployment',
        status: 'upcoming',
        position: 3,
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    const { data: insertedMilestones, error: milestoneError } = await supabase
      .from('milestones')
      .insert(milestones)
      .select();
    
    if (milestoneError) throw milestoneError;
    
    console.log(`✅ Created ${insertedMilestones.length} test milestones`);
    
    // Create tasks for the first two milestones
    const tasks = [
      // Tasks for completed milestone
      {
        milestone_id: insertedMilestones[0].id,
        title: 'Conduct user interviews',
        description: 'Interview 10 key stakeholders',
        status: 'done',
        priority: 'high',
        position: 0
      },
      {
        milestone_id: insertedMilestones[0].id,
        title: 'Analyze competitor websites',
        description: 'Review top 5 competitors',
        status: 'done',
        priority: 'medium',
        position: 1
      },
      {
        milestone_id: insertedMilestones[0].id,
        title: 'Create user personas',
        description: 'Develop 3 primary user personas',
        status: 'done',
        priority: 'high',
        position: 2
      },
      // Tasks for in-progress milestone
      {
        milestone_id: insertedMilestones[1].id,
        title: 'Create wireframes',
        description: 'Low-fidelity wireframes for all pages',
        status: 'done',
        priority: 'high',
        position: 0
      },
      {
        milestone_id: insertedMilestones[1].id,
        title: 'Design homepage mockup',
        description: 'High-fidelity design for homepage',
        status: 'in_progress',
        priority: 'urgent',
        position: 0,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        milestone_id: insertedMilestones[1].id,
        title: 'Design system components',
        description: 'Create reusable UI components',
        status: 'todo',
        priority: 'high',
        position: 0
      },
      {
        milestone_id: insertedMilestones[1].id,
        title: 'Mobile responsive designs',
        description: 'Adapt designs for mobile devices',
        status: 'todo',
        priority: 'medium',
        position: 1
      },
      {
        milestone_id: insertedMilestones[1].id,
        title: 'Design review meeting',
        description: 'Present designs to stakeholders',
        status: 'blocked',
        priority: 'high',
        position: 0
      }
    ];
    
    const { data: insertedTasks, error: taskError } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();
    
    if (taskError) throw taskError;
    
    console.log(`✅ Created ${insertedTasks.length} test tasks`);
    
    // Don't update progress - it's computed automatically
    
    console.log('\n✅ Test data created successfully!');
    console.log('\nServices created:');
    insertedServices.forEach(s => console.log(`  - ${s.name} (${s.status})`));
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

createTestServices();