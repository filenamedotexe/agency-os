/**
 * Create Demo Services Data
 * Populates the database with realistic service/project data
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Demo data
const demoServices = [
  {
    name: 'Website Redesign',
    description: 'Complete redesign of company website with modern UI/UX',
    status: 'active',
    color: 'blue',
    budget: 25000,
    client_email: 'sarah@acmecorp.com',
    milestones: [
      {
        name: 'Discovery & Research',
        description: 'User research, competitor analysis, and requirements gathering',
        status: 'completed',
        position: 0,
        tasks: [
          { title: 'User interviews', status: 'done', priority: 'high', position: 0 },
          { title: 'Competitor analysis', status: 'done', priority: 'medium', position: 1 },
          { title: 'Create user personas', status: 'done', priority: 'high', position: 2 },
          { title: 'Define requirements', status: 'done', priority: 'high', position: 3 }
        ]
      },
      {
        name: 'Design Phase',
        description: 'Wireframes, mockups, and design system creation',
        status: 'in_progress',
        position: 1,
        tasks: [
          { title: 'Create wireframes', status: 'done', priority: 'high', position: 0 },
          { title: 'Design homepage mockup', status: 'done', priority: 'high', position: 1 },
          { title: 'Design internal pages', status: 'in_progress', priority: 'high', position: 2 },
          { title: 'Create design system', status: 'in_progress', priority: 'medium', position: 3 },
          { title: 'Mobile responsive designs', status: 'todo', priority: 'high', position: 4 },
          { title: 'Design review with client', status: 'todo', priority: 'urgent', position: 5 }
        ]
      },
      {
        name: 'Development',
        description: 'Frontend and backend development',
        status: 'upcoming',
        position: 2,
        tasks: [
          { title: 'Setup development environment', status: 'todo', priority: 'high', position: 0 },
          { title: 'Implement homepage', status: 'todo', priority: 'high', position: 1 },
          { title: 'Implement CMS integration', status: 'todo', priority: 'medium', position: 2 },
          { title: 'Add contact forms', status: 'todo', priority: 'medium', position: 3 },
          { title: 'SEO optimization', status: 'todo', priority: 'low', position: 4 }
        ]
      },
      {
        name: 'Testing & Launch',
        description: 'Quality assurance and deployment',
        status: 'upcoming',
        position: 3,
        tasks: [
          { title: 'Cross-browser testing', status: 'todo', priority: 'high', position: 0 },
          { title: 'Performance optimization', status: 'todo', priority: 'medium', position: 1 },
          { title: 'Security audit', status: 'todo', priority: 'high', position: 2 },
          { title: 'Deploy to production', status: 'todo', priority: 'urgent', position: 3 }
        ]
      }
    ]
  },
  {
    name: 'Mobile App Development',
    description: 'Native iOS and Android app for e-commerce platform',
    status: 'active',
    color: 'purple',
    budget: 45000,
    client_email: 'mike@techstartup.co',
    milestones: [
      {
        name: 'Planning & Architecture',
        description: 'Technical planning and system architecture',
        status: 'completed',
        position: 0,
        tasks: [
          { title: 'Define app architecture', status: 'done', priority: 'high', position: 0 },
          { title: 'API specification', status: 'done', priority: 'high', position: 1 },
          { title: 'Database schema design', status: 'done', priority: 'medium', position: 2 }
        ]
      },
      {
        name: 'MVP Development',
        description: 'Core features implementation',
        status: 'in_progress',
        position: 1,
        tasks: [
          { title: 'User authentication', status: 'done', priority: 'high', position: 0 },
          { title: 'Product catalog', status: 'done', priority: 'high', position: 1 },
          { title: 'Shopping cart', status: 'in_progress', priority: 'high', position: 2 },
          { title: 'Payment integration', status: 'in_progress', priority: 'urgent', position: 3 },
          { title: 'Order tracking', status: 'todo', priority: 'medium', position: 4 },
          { title: 'Push notifications', status: 'todo', priority: 'low', position: 5 }
        ]
      },
      {
        name: 'Beta Testing',
        description: 'User testing and feedback incorporation',
        status: 'upcoming',
        position: 2,
        tasks: [
          { title: 'Internal testing', status: 'todo', priority: 'high', position: 0 },
          { title: 'Beta user recruitment', status: 'todo', priority: 'medium', position: 1 },
          { title: 'Collect feedback', status: 'todo', priority: 'high', position: 2 },
          { title: 'Bug fixes', status: 'todo', priority: 'urgent', position: 3 }
        ]
      }
    ]
  },
  {
    name: 'Digital Marketing Campaign',
    description: 'Q4 2024 integrated marketing campaign',
    status: 'planning',
    color: 'green',
    budget: 15000,
    client_email: 'lisa@retailplus.com',
    milestones: [
      {
        name: 'Strategy Development',
        description: 'Campaign strategy and planning',
        status: 'in_progress',
        position: 0,
        tasks: [
          { title: 'Market research', status: 'done', priority: 'high', position: 0 },
          { title: 'Define target audience', status: 'in_progress', priority: 'high', position: 1 },
          { title: 'Campaign messaging', status: 'todo', priority: 'high', position: 2 },
          { title: 'Channel selection', status: 'todo', priority: 'medium', position: 3 }
        ]
      },
      {
        name: 'Content Creation',
        description: 'Create campaign assets',
        status: 'upcoming',
        position: 1,
        tasks: [
          { title: 'Social media graphics', status: 'todo', priority: 'high', position: 0 },
          { title: 'Video content', status: 'todo', priority: 'high', position: 1 },
          { title: 'Email templates', status: 'todo', priority: 'medium', position: 2 },
          { title: 'Landing pages', status: 'todo', priority: 'high', position: 3 }
        ]
      },
      {
        name: 'Campaign Execution',
        description: 'Launch and manage campaign',
        status: 'upcoming',
        position: 2,
        tasks: [
          { title: 'Social media scheduling', status: 'todo', priority: 'high', position: 0 },
          { title: 'Email campaign setup', status: 'todo', priority: 'high', position: 1 },
          { title: 'PPC campaign launch', status: 'todo', priority: 'medium', position: 2 },
          { title: 'Monitor performance', status: 'todo', priority: 'high', position: 3 }
        ]
      }
    ]
  },
  {
    name: 'Brand Identity Refresh',
    description: 'Update brand guidelines and visual identity',
    status: 'completed',
    color: 'orange',
    budget: 8000,
    client_email: 'sarah@acmecorp.com',
    milestones: [
      {
        name: 'Brand Audit',
        description: 'Analyze current brand positioning',
        status: 'completed',
        position: 0,
        tasks: [
          { title: 'Stakeholder interviews', status: 'done', priority: 'high', position: 0 },
          { title: 'Brand perception survey', status: 'done', priority: 'medium', position: 1 },
          { title: 'Competitive analysis', status: 'done', priority: 'medium', position: 2 }
        ]
      },
      {
        name: 'Visual Identity Design',
        description: 'Create new visual elements',
        status: 'completed',
        position: 1,
        tasks: [
          { title: 'Logo refinement', status: 'done', priority: 'high', position: 0 },
          { title: 'Color palette update', status: 'done', priority: 'high', position: 1 },
          { title: 'Typography selection', status: 'done', priority: 'medium', position: 2 },
          { title: 'Icon set design', status: 'done', priority: 'low', position: 3 }
        ]
      },
      {
        name: 'Brand Guidelines',
        description: 'Document brand standards',
        status: 'completed',
        position: 2,
        tasks: [
          { title: 'Create brand book', status: 'done', priority: 'high', position: 0 },
          { title: 'Usage guidelines', status: 'done', priority: 'medium', position: 1 },
          { title: 'Template creation', status: 'done', priority: 'low', position: 2 }
        ]
      }
    ]
  }
]

async function createDemoServices() {
  console.log('🚀 Starting demo services creation...')

  try {
    // Get user IDs
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role')
    
    const adminUser = profiles.find(p => p.email === 'admin@demo.com')
    const teamUser = profiles.find(p => p.email === 'team@demo.com')
    
    if (!adminUser || !teamUser) {
      console.error('Required users not found. Please run create-demo-users.js first')
      return
    }

    console.log('Found admin and team users')

    // Process each demo service
    for (const serviceData of demoServices) {
      const clientProfile = profiles.find(p => p.email === serviceData.client_email)
      
      if (!clientProfile) {
        console.log(`Client ${serviceData.client_email} not found, skipping service: ${serviceData.name}`)
        continue
      }

      console.log(`\nCreating service: ${serviceData.name} for ${serviceData.client_email}`)

      // Calculate dates
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 2) // Started 2 months ago
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 2) // Ends in 2 months

      // Create service
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .insert({
          name: serviceData.name,
          description: serviceData.description,
          client_id: clientProfile.id,
          status: serviceData.status,
          color: serviceData.color,
          budget: serviceData.budget,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          created_by: adminUser.id
        })
        .select()
        .single()

      if (serviceError) {
        console.error(`Error creating service: ${serviceError.message}`)
        continue
      }

      console.log(`  ✓ Created service: ${service.id}`)

      // Add team members
      const teamMembers = [
        { user_id: adminUser.id, role: 'lead' },
        { user_id: teamUser.id, role: 'member' }
      ]

      for (const member of teamMembers) {
        const { error: memberError } = await supabase
          .from('service_members')
          .insert({
            service_id: service.id,
            user_id: member.user_id,
            role: member.role
          })

        if (memberError) {
          console.error(`Error adding team member: ${memberError.message}`)
        }
      }

      console.log(`  ✓ Added ${teamMembers.length} team members`)

      // Create milestones and tasks
      for (const milestoneData of serviceData.milestones) {
        // Calculate milestone due date
        const milestoneDueDate = new Date()
        milestoneDueDate.setMonth(milestoneDueDate.getMonth() + milestoneData.position - 1)

        const { data: milestone, error: milestoneError } = await supabase
          .from('milestones')
          .insert({
            service_id: service.id,
            name: milestoneData.name,
            description: milestoneData.description,
            status: milestoneData.status,
            position: milestoneData.position,
            due_date: milestoneDueDate.toISOString().split('T')[0],
            completed_at: milestoneData.status === 'completed' ? new Date().toISOString() : null
          })
          .select()
          .single()

        if (milestoneError) {
          console.error(`Error creating milestone: ${milestoneError.message}`)
          continue
        }

        console.log(`    ✓ Created milestone: ${milestone.name}`)

        // Create tasks for this milestone
        for (const taskData of milestoneData.tasks) {
          // Randomly assign tasks
          const assignTo = Math.random() > 0.5 ? adminUser.id : teamUser.id
          
          // Calculate task due date
          const taskDueDate = new Date()
          taskDueDate.setDate(taskDueDate.getDate() + (7 * taskData.position)) // Each task 1 week apart

          const { error: taskError } = await supabase
            .from('tasks')
            .insert({
              milestone_id: milestone.id,
              title: taskData.title,
              status: taskData.status,
              priority: taskData.priority,
              position: taskData.position,
              assigned_to: assignTo,
              created_by: adminUser.id,
              due_date: taskDueDate.toISOString(),
              completed_at: taskData.status === 'done' ? new Date().toISOString() : null
            })

          if (taskError) {
            console.error(`Error creating task: ${taskError.message}`)
          }
        }

        console.log(`      ✓ Created ${milestoneData.tasks.length} tasks`)
      }

      // Add some sample comments on random tasks
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, milestone_id')
        .in('milestone_id', serviceData.milestones.map((_, i) => service.id))
        .limit(3)

      if (allTasks && allTasks.length > 0) {
        const sampleComments = [
          'Looking good! Just need to finalize a few details.',
          'Client requested some changes. Updated the requirements.',
          'This is taking longer than expected. May need additional resources.',
          'Great progress on this! Should be ready for review soon.',
          'Blocked by waiting for client feedback.'
        ]

        for (const task of allTasks.slice(0, 2)) {
          const comment = sampleComments[Math.floor(Math.random() * sampleComments.length)]
          const { error: commentError } = await supabase
            .from('task_comments')
            .insert({
              task_id: task.id,
              user_id: Math.random() > 0.5 ? adminUser.id : teamUser.id,
              content: comment
            })

          if (commentError) {
            console.error(`Error creating comment: ${commentError.message}`)
          }
        }
        console.log(`      ✓ Added sample comments`)
      }
    }

    console.log('\n✅ Demo services creation complete!')
    
    // Show summary
    const { count: serviceCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
    
    const { count: milestoneCount } = await supabase
      .from('milestones')
      .select('*', { count: 'exact', head: true })
    
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    console.log('\n📊 Summary:')
    console.log(`  - Services: ${serviceCount}`)
    console.log(`  - Milestones: ${milestoneCount}`)
    console.log(`  - Tasks: ${taskCount}`)

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
createDemoServices()