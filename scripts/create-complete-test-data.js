const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lfqnpszawjpcydobpxul.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcW5wc3phd2pwY3lkb2JweHVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxMTg0MCwiZXhwIjoyMDcwMjg3ODQwfQ.nXx3ntxw6mrLfSWyC4qTrtYLo4lOqToSmZMrjB7YVjc'
);

async function createCompleteTestData() {
  console.log('🚀 Creating complete test data for 100% testing...\n');
  
  try {
    // Get first service
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .limit(1);
    
    if (!services || services.length === 0) {
      console.log('No services found. Please run create-test-services.js first');
      return;
    }
    
    const serviceId = services[0].id;
    console.log('Using service:', services[0].name);
    
    // Get or create milestones
    const { data: existingMilestones } = await supabase
      .from('milestones')
      .select('*')
      .eq('service_id', serviceId)
      .order('position');
    
    let milestones = existingMilestones;
    
    if (!milestones || milestones.length === 0) {
      console.log('Creating milestones...');
      
      const newMilestones = [
        {
          service_id: serviceId,
          name: 'Planning Phase',
          description: 'Initial planning and requirements',
          status: 'completed',
          position: 0,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          service_id: serviceId,
          name: 'Design Phase',
          description: 'UI/UX design and prototypes',
          status: 'in_progress',
          position: 1,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          service_id: serviceId,
          name: 'Development Phase',
          description: 'Core development work',
          status: 'upcoming',
          position: 2,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      const { data: created, error } = await supabase
        .from('milestones')
        .insert(newMilestones)
        .select();
      
      if (error) throw error;
      milestones = created;
      console.log(`✅ Created ${milestones.length} milestones`);
    } else {
      console.log(`Found ${milestones.length} existing milestones`);
    }
    
    // Create comprehensive tasks for each status
    console.log('\nCreating tasks for all columns...');
    
    const taskStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    
    let tasksToCreate = [];
    
    for (const milestone of milestones.slice(0, 2)) { // Use first 2 milestones
      let position = 0;
      
      for (const status of taskStatuses) {
        // Create 2-3 tasks per status
        const taskCount = status === 'todo' ? 3 : 2;
        
        for (let i = 0; i < taskCount; i++) {
          const priority = priorities[Math.floor(Math.random() * priorities.length)];
          
          tasksToCreate.push({
            milestone_id: milestone.id,
            title: `${status.replace('_', ' ').toUpperCase()} Task ${i + 1}`,
            description: `Test task in ${status} column for drag and drop testing`,
            status: status,
            priority: priority,
            position: position++,
            due_date: status === 'done' ? null : new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    }
    
    // Delete existing tasks to avoid duplicates
    console.log('Clearing old test tasks...');
    for (const milestone of milestones) {
      await supabase
        .from('tasks')
        .delete()
        .eq('milestone_id', milestone.id)
        .like('title', '%Task%');
    }
    
    // Insert new tasks
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .insert(tasksToCreate)
      .select();
    
    if (taskError) throw taskError;
    
    console.log(`✅ Created ${tasks.length} tasks across all columns`);
    
    // Summary
    console.log('\n📊 Test Data Summary:');
    console.log('─'.repeat(40));
    
    const tasksByStatus = {};
    for (const task of tasks) {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    }
    
    for (const [status, count] of Object.entries(tasksByStatus)) {
      console.log(`${status.padEnd(15)} : ${count} tasks`);
    }
    
    console.log('─'.repeat(40));
    console.log('\n✅ Complete test data created successfully!');
    console.log('You now have tasks in all columns for drag & drop testing.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCompleteTestData();