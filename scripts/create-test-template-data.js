#!/usr/bin/env node

/**
 * CREATE TEST DATA FOR SERVICE TEMPLATES
 * Creates realistic test data using existing users
 * Date: 2025-08-19
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
}

// Initialize Supabase service client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

let createdData = {
  templates: [],
  services: [],
  clients: []
}

/**
 * Get existing admin user
 */
async function getAdminUser() {
  const { data, error } = await serviceClient
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'admin')
    .limit(1)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get or create test client
 */
async function getTestClient() {
  // Try to find existing client
  const { data: existingClient } = await serviceClient
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'client')
    .limit(1)
    .single()
  
  if (existingClient) {
    log.info(`Using existing client: ${existingClient.email}`)
    return existingClient
  }
  
  // Create new test client if none exists
  const { data, error } = await serviceClient
    .from('profiles')
    .insert({
      email: 'testclient@templates.test',
      role: 'client'
    })
    .select()
    .single()
  
  if (error) throw error
  createdData.clients.push(data.id)
  return data
}

/**
 * Create default service templates
 */
async function createDefaultTemplates(adminUserId) {
  log.header('CREATING DEFAULT SERVICE TEMPLATES')
  
  const templates = [
    {
      name: 'Website Development',
      description: 'Complete website development project template',
      color: 'blue',
      milestones: [
        {
          name: 'Discovery & Planning',
          description: 'Project kickoff and requirements gathering',
          position: 0,
          relative_start_days: 0,
          relative_due_days: 7,
          tasks: [
            { title: 'Client kickoff meeting', position: 0, priority: 'high', visibility: 'client', relative_due_days: 1 },
            { title: 'Requirements gathering', position: 1, priority: 'high', visibility: 'internal', relative_due_days: 3 },
            { title: 'Technical architecture planning', position: 2, priority: 'medium', visibility: 'internal', relative_due_days: 5 }
          ]
        },
        {
          name: 'Design & Prototyping',
          description: 'UI/UX design and prototyping phase',
          position: 1,
          relative_start_days: 7,
          relative_due_days: 21,
          tasks: [
            { title: 'Wireframe creation', position: 0, priority: 'high', visibility: 'client', relative_due_days: 7 },
            { title: 'Visual design mockups', position: 1, priority: 'high', visibility: 'client', relative_due_days: 10 },
            { title: 'Interactive prototype', position: 2, priority: 'medium', visibility: 'client', relative_due_days: 14 }
          ]
        },
        {
          name: 'Development',
          description: 'Frontend and backend development',
          position: 2,
          relative_start_days: 21,
          relative_due_days: 49,
          tasks: [
            { title: 'Frontend development', position: 0, priority: 'high', visibility: 'internal', relative_due_days: 14 },
            { title: 'Backend API development', position: 1, priority: 'high', visibility: 'internal', relative_due_days: 14 },
            { title: 'Database setup', position: 2, priority: 'medium', visibility: 'internal', relative_due_days: 7 },
            { title: 'Integration testing', position: 3, priority: 'high', visibility: 'internal', relative_due_days: 21 }
          ]
        },
        {
          name: 'Testing & Launch',
          description: 'Quality assurance and go-live',
          position: 3,
          relative_start_days: 49,
          relative_due_days: 56,
          tasks: [
            { title: 'User acceptance testing', position: 0, priority: 'high', visibility: 'client', relative_due_days: 3 },
            { title: 'Performance optimization', position: 1, priority: 'medium', visibility: 'internal', relative_due_days: 5 },
            { title: 'Production deployment', position: 2, priority: 'high', visibility: 'internal', relative_due_days: 7 }
          ]
        }
      ]
    },
    {
      name: 'Marketing Campaign',
      description: 'Digital marketing campaign template',
      color: 'green',
      milestones: [
        {
          name: 'Campaign Strategy',
          description: 'Strategy development and planning',
          position: 0,
          relative_start_days: 0,
          relative_due_days: 7,
          tasks: [
            { title: 'Market research', position: 0, priority: 'high', visibility: 'internal', relative_due_days: 3 },
            { title: 'Target audience analysis', position: 1, priority: 'high', visibility: 'client', relative_due_days: 5 },
            { title: 'Campaign objectives definition', position: 2, priority: 'high', visibility: 'client', relative_due_days: 7 }
          ]
        },
        {
          name: 'Content Creation',
          description: 'Creative assets and content development',
          position: 1,
          relative_start_days: 7,
          relative_due_days: 21,
          tasks: [
            { title: 'Creative brief development', position: 0, priority: 'high', visibility: 'client', relative_due_days: 3 },
            { title: 'Visual assets creation', position: 1, priority: 'high', visibility: 'client', relative_due_days: 10 },
            { title: 'Copy writing', position: 2, priority: 'high', visibility: 'client', relative_due_days: 10 },
            { title: 'Content approval', position: 3, priority: 'medium', visibility: 'client', relative_due_days: 14 }
          ]
        },
        {
          name: 'Campaign Execution',
          description: 'Launch and monitor campaign',
          position: 2,
          relative_start_days: 21,
          relative_due_days: 28,
          tasks: [
            { title: 'Campaign setup', position: 0, priority: 'high', visibility: 'internal', relative_due_days: 2 },
            { title: 'Campaign launch', position: 1, priority: 'high', visibility: 'client', relative_due_days: 3 },
            { title: 'Performance monitoring', position: 2, priority: 'medium', visibility: 'internal', relative_due_days: 7 }
          ]
        },
        {
          name: 'Analysis & Reporting',
          description: 'Campaign analysis and reporting',
          position: 3,
          relative_start_days: 28,
          relative_due_days: 35,
          tasks: [
            { title: 'Data collection', position: 0, priority: 'medium', visibility: 'internal', relative_due_days: 3 },
            { title: 'Performance analysis', position: 1, priority: 'high', visibility: 'internal', relative_due_days: 5 },
            { title: 'Final report creation', position: 2, priority: 'high', visibility: 'client', relative_due_days: 7 }
          ]
        }
      ]
    },
    {
      name: 'Mobile App Development',
      description: 'Mobile application development template',
      color: 'purple',
      milestones: [
        {
          name: 'App Planning',
          description: 'Mobile app planning and specification',
          position: 0,
          relative_start_days: 0,
          relative_due_days: 14,
          tasks: [
            { title: 'Platform selection', position: 0, priority: 'high', visibility: 'client', relative_due_days: 3 },
            { title: 'Feature specification', position: 1, priority: 'high', visibility: 'client', relative_due_days: 7 },
            { title: 'Technical specification', position: 2, priority: 'medium', visibility: 'internal', relative_due_days: 10 },
            { title: 'Development timeline', position: 3, priority: 'medium', visibility: 'client', relative_due_days: 14 }
          ]
        },
        {
          name: 'UI/UX Design',
          description: 'Mobile app design and user experience',
          position: 1,
          relative_start_days: 14,
          relative_due_days: 28,
          tasks: [
            { title: 'User journey mapping', position: 0, priority: 'high', visibility: 'client', relative_due_days: 5 },
            { title: 'App wireframes', position: 1, priority: 'high', visibility: 'client', relative_due_days: 8 },
            { title: 'Visual design', position: 2, priority: 'high', visibility: 'client', relative_due_days: 12 },
            { title: 'Prototype testing', position: 3, priority: 'medium', visibility: 'client', relative_due_days: 14 }
          ]
        },
        {
          name: 'Development & Testing',
          description: 'App development and quality assurance',
          position: 2,
          relative_start_days: 28,
          relative_due_days: 70,
          tasks: [
            { title: 'Core functionality development', position: 0, priority: 'high', visibility: 'internal', relative_due_days: 21 },
            { title: 'API integration', position: 1, priority: 'high', visibility: 'internal', relative_due_days: 28 },
            { title: 'Testing and debugging', position: 2, priority: 'high', visibility: 'internal', relative_due_days: 35 },
            { title: 'Beta testing', position: 3, priority: 'medium', visibility: 'client', relative_due_days: 42 }
          ]
        },
        {
          name: 'App Store Deployment',
          description: 'App store submission and launch',
          position: 3,
          relative_start_days: 70,
          relative_due_days: 84,
          tasks: [
            { title: 'App store preparation', position: 0, priority: 'high', visibility: 'internal', relative_due_days: 7 },
            { title: 'App store submission', position: 1, priority: 'high', visibility: 'client', relative_due_days: 10 },
            { title: 'Launch monitoring', position: 2, priority: 'medium', visibility: 'internal', relative_due_days: 14 }
          ]
        }
      ]
    }
  ]
  
  for (const template of templates) {
    try {
      log.info(`Creating template: ${template.name}`)
      
      // Create template
      const { data: createdTemplate, error: templateError } = await serviceClient
        .from('service_templates')
        .insert({
          name: template.name,
          description: template.description,
          color: template.color,
          created_by: adminUserId,
          is_default: true
        })
        .select()
        .single()
      
      if (templateError) throw templateError
      createdData.templates.push(createdTemplate.id)
      log.success(`Created template: ${template.name}`)
      
      // Create milestones
      for (const milestone of template.milestones) {
        const { data: createdMilestone, error: milestoneError } = await serviceClient
          .from('template_milestones')
          .insert({
            template_id: createdTemplate.id,
            name: milestone.name,
            description: milestone.description,
            position: milestone.position,
            relative_start_days: milestone.relative_start_days,
            relative_due_days: milestone.relative_due_days
          })
          .select()
          .single()
        
        if (milestoneError) throw milestoneError
        
        // Create tasks for this milestone
        for (const task of milestone.tasks) {
          const { error: taskError } = await serviceClient
            .from('template_tasks')
            .insert({
              template_milestone_id: createdMilestone.id,
              title: task.title,
              position: task.position,
              priority: task.priority,
              visibility: task.visibility,
              relative_due_days: task.relative_due_days
            })
          
          if (taskError) throw taskError
        }
      }
      
      log.success(`Created ${template.milestones.length} milestones and ${template.milestones.reduce((sum, m) => sum + m.tasks.length, 0)} tasks`)
      
    } catch (error) {
      log.error(`Failed to create template ${template.name}: ${error.message}`)
    }
  }
}

/**
 * Create test service from template
 */
async function createTestService(clientId, adminUserId) {
  log.header('CREATING TEST SERVICE FROM TEMPLATE')
  
  if (createdData.templates.length === 0) {
    log.warning('No templates available to create service from')
    return
  }
  
  const templateId = createdData.templates[0] // Use first template (Website Development)
  
  try {
    // Create service
    const { data: service, error: serviceError } = await serviceClient
      .from('services')
      .insert({
        client_id: clientId,
        name: 'Test Website Project from Template',
        description: 'A test service created from the Website Development template',
        start_date: '2025-01-01',
        budget: '25000',
        color: 'blue',
        status: 'planning',
        created_by: adminUserId
      })
      .select()
      .single()
    
    if (serviceError) throw serviceError
    createdData.services.push(service.id)
    log.success(`Created service: ${service.name}`)
    
    // Get template milestones
    const { data: templateMilestones, error: milestoneError } = await serviceClient
      .from('template_milestones')
      .select('*')
      .eq('template_id', templateId)
      .order('position')
    
    if (milestoneError) throw milestoneError
    
    // Create milestones from template with smart dates
    for (const templateMilestone of templateMilestones) {
      const serviceStartDate = new Date('2025-01-01T00:00:00.000Z')
      const milestoneDueDate = new Date(serviceStartDate)
      milestoneDueDate.setDate(milestoneDueDate.getDate() + (templateMilestone.relative_due_days || 0))
      
      const { data: milestone, error: createError } = await serviceClient
        .from('milestones')
        .insert({
          service_id: service.id,
          name: templateMilestone.name,
          description: templateMilestone.description,
          position: templateMilestone.position,
          due_date: milestoneDueDate.toISOString(),
          status: 'upcoming'
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      // Get template tasks for this milestone
      const { data: templateTasks, error: taskQueryError } = await serviceClient
        .from('template_tasks')
        .select('*')
        .eq('template_milestone_id', templateMilestone.id)
        .order('position')
      
      if (taskQueryError) throw taskQueryError
      
      // Create tasks from template
      for (const templateTask of templateTasks) {
        const milestoneStartDate = new Date(serviceStartDate)
        milestoneStartDate.setDate(milestoneStartDate.getDate() + templateMilestone.relative_start_days)
        
        const taskDueDate = new Date(milestoneStartDate)
        taskDueDate.setDate(taskDueDate.getDate() + (templateTask.relative_due_days || 0))
        
        const { error: taskCreateError } = await serviceClient
          .from('tasks')
          .insert({
            milestone_id: milestone.id,
            title: templateTask.title,
            description: templateTask.description,
            priority: templateTask.priority,
            position: templateTask.position,
            due_date: taskDueDate.toISOString(),
            status: 'todo',
            visibility: templateTask.visibility,
            created_by: adminUserId
          })
        
        if (taskCreateError) throw taskCreateError
      }
    }
    
    log.success(`Created service with ${templateMilestones.length} milestones and smart date calculations`)
    
  } catch (error) {
    log.error(`Failed to create test service: ${error.message}`)
  }
}

/**
 * Validate created data
 */
async function validateCreatedData() {
  log.header('VALIDATING CREATED DATA')
  
  try {
    // Check template summary view
    const { data: templateSummaries, error: summaryError } = await serviceClient
      .from('template_summary')
      .select('*')
      .in('id', createdData.templates)
    
    if (summaryError) throw summaryError
    
    templateSummaries.forEach(summary => {
      log.success(`Template "${summary.name}": ${summary.milestone_count} milestones, ${summary.task_count} tasks`)
    })
    
    // Check service creation
    if (createdData.services.length > 0) {
      const { data: services, error: serviceError } = await serviceClient
        .from('services')
        .select(`
          name,
          status,
          milestones(count)
        `)
        .in('id', createdData.services)
      
      if (serviceError) throw serviceError
      
      services.forEach(service => {
        log.success(`Service "${service.name}": ${service.milestones.length} milestones created`)
      })
    }
    
    log.success('All data validation passed')
    
  } catch (error) {
    log.error(`Data validation failed: ${error.message}`)
  }
}

/**
 * Main execution
 */
async function createTestData() {
  console.log(`${colors.bright}${colors.cyan}`)
  console.log('==================================================')
  console.log('CREATING SERVICE TEMPLATE TEST DATA')
  console.log('==================================================')
  console.log(colors.reset)
  
  try {
    const adminUser = await getAdminUser()
    log.success(`Using admin user: ${adminUser.email}`)
    
    const testClient = await getTestClient()
    log.success(`Using client: ${testClient.email}`)
    
    await createDefaultTemplates(adminUser.id)
    await createTestService(testClient.id, adminUser.id)
    await validateCreatedData()
    
    console.log(`\n${colors.bright}${colors.green}TEST DATA CREATION COMPLETED${colors.reset}`)
    console.log('==================================================')
    console.log(`Templates created: ${createdData.templates.length}`)
    console.log(`Services created: ${createdData.services.length}`)
    console.log(`Clients created: ${createdData.clients.length}`)
    console.log('==================================================')
    
    if (process.argv.includes('--show-ids')) {
      console.log('\nCreated IDs for reference:')
      console.log('Templates:', createdData.templates)
      console.log('Services:', createdData.services)
      console.log('Clients:', createdData.clients)
    }
    
  } catch (error) {
    log.error(`Failed to create test data: ${error.message}`)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  createTestData()
}

module.exports = { createTestData, createdData }