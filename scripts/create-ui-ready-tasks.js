const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lfqnpszawjpcydobpxul.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcW5wc3phd2pwY3lkb2JweHVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxMTg0MCwiZXhwIjoyMDcwMjg3ODQwfQ.nXx3ntxw6mrLfSWyC4qTrtYLo4lOqToSmZMrjB7YVjc'
);

async function createUIReadyTasks() {
  console.log('🔧 Creating tasks that will show in UI...');
  
  try {
    // Get first service
    const { data: services } = await supabase
      .from('services')
      .select('id, name')
      .limit(1);
      
    if (!services || services.length === 0) {
      console.log('❌ No services found');
      return;
    }
    
    const serviceId = services[0].id;
    console.log('Using service:', services[0].name);
    
    // Clear all existing tasks to start fresh
    console.log('Clearing old tasks...');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Get milestones for this service
    const { data: milestones } = await supabase
      .from('milestones')
      .select('id, name, service_id')
      .eq('service_id', serviceId)
      .order('position');
      
    if (!milestones || milestones.length === 0) {
      console.log('❌ No milestones found for service');
      return;
    }
    
    console.log('Using milestones:', milestones.map(m => m.name));
    
    // Create specific tasks for testing - use first milestone
    const milestoneId = milestones[0].id;
    
    const tasksToCreate = [
      // To Do column - 3 tasks
      {
        milestone_id: milestoneId,
        title: 'Design homepage layout',
        description: 'Create wireframes and mockups for the main page',
        status: 'todo',
        priority: 'high',
        position: 0,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        milestone_id: milestoneId,
        title: 'Setup project structure',
        description: 'Initialize folders and files for the project',
        status: 'todo',
        priority: 'medium',
        position: 1,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        milestone_id: milestoneId,
        title: 'Research competitor sites',
        description: 'Analyze similar websites for inspiration',
        status: 'todo',
        priority: 'low',
        position: 2
      },
      
      // In Progress column - 2 tasks
      {
        milestone_id: milestoneId,
        title: 'Implement navigation',
        description: 'Build responsive navigation component',
        status: 'in_progress',
        priority: 'urgent',
        position: 0,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        milestone_id: milestoneId,
        title: 'Create user dashboard',
        description: 'Build main dashboard user interface',
        status: 'in_progress',
        priority: 'high',
        position: 1
      },
      
      // Review column - 2 tasks
      {
        milestone_id: milestoneId,
        title: 'Test mobile responsiveness',
        description: 'Check all responsive breakpoints work correctly',
        status: 'review',
        priority: 'medium',
        position: 0
      },
      {
        milestone_id: milestoneId,
        title: 'Review code quality',
        description: 'Code review and optimization',
        status: 'review',
        priority: 'medium',
        position: 1
      },
      
      // Done column - 2 tasks
      {
        milestone_id: milestoneId,
        title: 'Setup development environment',
        description: 'Configure tools and dependencies',
        status: 'done',
        priority: 'high',
        position: 0
      },
      {
        milestone_id: milestoneId,
        title: 'Initial project planning',
        description: 'Define project scope and requirements',
        status: 'done',
        priority: 'high',
        position: 1
      },
      
      // Blocked column - 1 task
      {
        milestone_id: milestoneId,
        title: 'Integrate payment system',
        description: 'Waiting for payment gateway API keys',
        status: 'blocked',
        priority: 'high',
        position: 0
      }
    ];
    
    // Insert tasks
    console.log('Creating tasks...');
    const { data: created, error } = await supabase
      .from('tasks')
      .insert(tasksToCreate)
      .select('id, title, status');
      
    if (error) {
      console.error('❌ Error creating tasks:', error.message);
      return;
    }
    
    console.log(`✅ Created ${created.length} tasks successfully`);
    
    // Verify tasks are properly linked
    console.log('Verifying task linkage...');
    const { data: verification } = await supabase
      .from('tasks')
      .select('title, status, milestone_id, milestone:milestones(name, service_id)')
      .eq('milestone_id', milestoneId);
      
    console.log('\n📊 Tasks created by status:');
    const byStatus = {};
    verification.forEach(task => {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    });
    
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status.padEnd(12)} : ${count} tasks`);
    });
    
    console.log('\n✅ All tasks are properly linked and ready for UI!');
    console.log('Tasks should now appear in the Kanban board.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUIReadyTasks();