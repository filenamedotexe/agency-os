#!/usr/bin/env node

/**
 * SEED DEFAULT TEMPLATES
 * Phase 4 Step 2: Production-ready template seeding script
 * Date: 2025-08-19
 * Purpose: Safely seed default templates in any environment
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// ANSI color codes for professional output
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

// Configuration
const config = {
  force: process.argv.includes('--force'),
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  clean: process.argv.includes('--clean')
}

// Initialize Supabase service client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

let seedStats = {
  templatesCreated: 0,
  milestonesCreated: 0,
  tasksCreated: 0,
  templatesSkipped: 0,
  errors: []
}

/**
 * Validate environment and permissions
 */
async function validateEnvironment() {
  log.header('VALIDATING ENVIRONMENT')
  
  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    }
    log.success('Environment variables validated')
    
    // Test database connection
    const { data: testQuery, error: testError } = await serviceClient
      .from('service_templates')
      .select('count')
      .limit(1)
    
    if (testError) throw new Error(`Database connection failed: ${testError.message}`)
    log.success('Database connection established')
    
    // Check for admin user
    const { data: adminUser, error: userError } = await serviceClient
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'admin')
      .limit(1)
      .single()
    
    if (userError) throw new Error('No admin user found in database')
    log.success(`Admin user found: ${adminUser.email}`)
    
    return adminUser
    
  } catch (error) {
    log.error(`Environment validation failed: ${error.message}`)
    throw error
  }
}

/**
 * Check if templates already exist
 */
async function checkExistingTemplates() {
  log.header('CHECKING EXISTING TEMPLATES')
  
  try {
    const { data: existingTemplates, error } = await serviceClient
      .from('service_templates')
      .select('id, name, is_default')
      .eq('is_default', true)
    
    if (error) throw error
    
    if (existingTemplates.length > 0) {
      log.warning(`Found ${existingTemplates.length} existing default templates:`)
      existingTemplates.forEach(template => {
        log.info(`  - ${template.name} (ID: ${template.id})`)
      })
      
      if (!config.force && !config.clean) {
        log.error('Default templates already exist. Use --force to recreate or --clean to remove first.')
        return false
      }
    } else {
      log.success('No existing default templates found')
    }
    
    return existingTemplates
    
  } catch (error) {
    log.error(`Failed to check existing templates: ${error.message}`)
    throw error
  }
}

/**
 * Clean existing default templates
 */
async function cleanExistingTemplates(existingTemplates) {
  if (!existingTemplates || existingTemplates.length === 0) return
  
  log.header('CLEANING EXISTING DEFAULT TEMPLATES')
  
  if (config.dryRun) {
    log.info('DRY RUN: Would delete the following templates:')
    existingTemplates.forEach(template => {
      log.info(`  - ${template.name}`)
    })
    return
  }
  
  try {
    for (const template of existingTemplates) {
      log.info(`Deleting template: ${template.name}`)
      
      const { error } = await serviceClient
        .from('service_templates')
        .delete()
        .eq('id', template.id)
      
      if (error) throw error
      
      log.success(`Deleted: ${template.name}`)
    }
    
    log.success(`Cleaned ${existingTemplates.length} existing default templates`)
    
  } catch (error) {
    log.error(`Failed to clean existing templates: ${error.message}`)
    throw error
  }
}

/**
 * Template definitions with comprehensive data
 */
const TEMPLATE_DEFINITIONS = [
  {
    name: 'Website Development',
    description: 'Complete website development project from planning to launch',
    color: 'blue',
    milestones: [
      {
        name: 'Discovery & Planning',
        description: 'Project kickoff and requirements gathering',
        position: 0,
        relative_start_days: '0',
        relative_due_days: '7',
        tasks: [
          { title: 'Client kickoff meeting', position: 0, priority: 'high', visibility: 'client', estimated_hours: 2, relative_due_days: '1' },
          { title: 'Requirements gathering', position: 1, priority: 'high', visibility: 'internal', estimated_hours: 8, relative_due_days: '3' },
          { title: 'Technical specification', position: 2, priority: 'medium', visibility: 'internal', estimated_hours: 6, relative_due_days: '5' },
          { title: 'Project timeline approval', position: 3, priority: 'high', visibility: 'client', estimated_hours: 2, relative_due_days: '7' }
        ]
      },
      {
        name: 'Design & Prototyping',
        description: 'UI/UX design and interactive prototypes',
        position: 1,
        relative_start_days: '7',
        relative_due_days: '21',
        tasks: [
          { title: 'Wireframe creation', position: 0, priority: 'high', visibility: 'client', estimated_hours: 12, relative_due_days: '5' },
          { title: 'Visual design mockups', position: 1, priority: 'high', visibility: 'client', estimated_hours: 16, relative_due_days: '10' },
          { title: 'Interactive prototype', position: 2, priority: 'medium', visibility: 'client', estimated_hours: 8, relative_due_days: '14' }
        ]
      },
      {
        name: 'Development',
        description: 'Frontend and backend development',
        position: 2,
        relative_start_days: '21',
        relative_due_days: '49',
        tasks: [
          { title: 'Frontend development', position: 0, priority: 'high', visibility: 'internal', estimated_hours: 40, relative_due_days: '14' },
          { title: 'Backend development', position: 1, priority: 'high', visibility: 'internal', estimated_hours: 32, relative_due_days: '14' },
          { title: 'CMS integration', position: 2, priority: 'medium', visibility: 'internal', estimated_hours: 16, relative_due_days: '21' },
          { title: 'Testing and bug fixes', position: 3, priority: 'high', visibility: 'internal', estimated_hours: 20, relative_due_days: '28' }
        ]
      },
      {
        name: 'Launch & Delivery',
        description: 'Testing, optimization, and go-live',
        position: 3,
        relative_start_days: '49',
        relative_due_days: '56',
        tasks: [
          { title: 'User acceptance testing', position: 0, priority: 'high', visibility: 'client', estimated_hours: 8, relative_due_days: '3' },
          { title: 'Performance optimization', position: 1, priority: 'medium', visibility: 'internal', estimated_hours: 6, relative_due_days: '5' },
          { title: 'Production deployment', position: 2, priority: 'high', visibility: 'internal', estimated_hours: 4, relative_due_days: '7' }
        ]
      }
    ]
  },
  {
    name: 'Marketing Campaign',
    description: 'Digital marketing campaign from strategy to analysis',
    color: 'green',
    milestones: [
      {
        name: 'Strategy & Planning',
        description: 'Campaign strategy and planning phase',
        position: 0,
        relative_start_days: '0',
        relative_due_days: '7',
        tasks: [
          { title: 'Market research', position: 0, priority: 'high', visibility: 'internal', estimated_hours: 8, relative_due_days: '3' },
          { title: 'Target audience analysis', position: 1, priority: 'high', visibility: 'client', estimated_hours: 6, relative_due_days: '5' },
          { title: 'Campaign objectives', position: 2, priority: 'high', visibility: 'client', estimated_hours: 4, relative_due_days: '7' }
        ]
      },
      {
        name: 'Content Creation',
        description: 'Creative content and asset development',
        position: 1,
        relative_start_days: '7',
        relative_due_days: '21',
        tasks: [
          { title: 'Creative brief', position: 0, priority: 'high', visibility: 'client', estimated_hours: 4, relative_due_days: '3' },
          { title: 'Visual content creation', position: 1, priority: 'high', visibility: 'client', estimated_hours: 16, relative_due_days: '10' },
          { title: 'Copy writing', position: 2, priority: 'high', visibility: 'client', estimated_hours: 12, relative_due_days: '10' },
          { title: 'Content approval', position: 3, priority: 'medium', visibility: 'client', estimated_hours: 4, relative_due_days: '14' }
        ]
      },
      {
        name: 'Campaign Execution',
        description: 'Campaign launch and monitoring',
        position: 2,
        relative_start_days: '21',
        relative_due_days: '35',
        tasks: [
          { title: 'Platform setup', position: 0, priority: 'high', visibility: 'internal', estimated_hours: 6, relative_due_days: '2' },
          { title: 'Campaign launch', position: 1, priority: 'high', visibility: 'client', estimated_hours: 4, relative_due_days: '3' },
          { title: 'Performance monitoring', position: 2, priority: 'medium', visibility: 'internal', estimated_hours: 20, relative_due_days: '14' }
        ]
      },
      {
        name: 'Analysis & Reporting',
        description: 'Campaign analysis and final reporting',
        position: 3,
        relative_start_days: '35',
        relative_due_days: '42',
        tasks: [
          { title: 'Data collection', position: 0, priority: 'medium', visibility: 'internal', estimated_hours: 6, relative_due_days: '3' },
          { title: 'Performance analysis', position: 1, priority: 'high', visibility: 'internal', estimated_hours: 8, relative_due_days: '5' },
          { title: 'Final report', position: 2, priority: 'high', visibility: 'client', estimated_hours: 6, relative_due_days: '7' }
        ]
      }
    ]
  },
  {
    name: 'Mobile App Development',
    description: 'Complete mobile application development lifecycle',
    color: 'purple',
    milestones: [
      {
        name: 'Planning & Architecture',
        description: 'Requirements analysis and technical planning',
        position: 0,
        relative_start_days: '0',
        relative_due_days: '14',
        tasks: [
          { title: 'Requirements analysis', position: 0, priority: 'high', visibility: 'client', estimated_hours: 12, relative_due_days: '5' },
          { title: 'Platform selection', position: 1, priority: 'high', visibility: 'internal', estimated_hours: 8, relative_due_days: '7' },
          { title: 'Technical architecture', position: 2, priority: 'high', visibility: 'internal', estimated_hours: 16, relative_due_days: '10' },
          { title: 'Development planning', position: 3, priority: 'medium', visibility: 'client', estimated_hours: 6, relative_due_days: '14' }
        ]
      },
      {
        name: 'UI/UX Design',
        description: 'User interface and experience design',
        position: 1,
        relative_start_days: '14',
        relative_due_days: '35',
        tasks: [
          { title: 'User journey mapping', position: 0, priority: 'high', visibility: 'client', estimated_hours: 10, relative_due_days: '7' },
          { title: 'Wireframe design', position: 1, priority: 'high', visibility: 'client', estimated_hours: 16, relative_due_days: '14' },
          { title: 'Visual design', position: 2, priority: 'high', visibility: 'client', estimated_hours: 20, relative_due_days: '18' },
          { title: 'Prototype testing', position: 3, priority: 'medium', visibility: 'client', estimated_hours: 8, relative_due_days: '21' }
        ]
      },
      {
        name: 'Development & Testing',
        description: 'App development and quality assurance',
        position: 2,
        relative_start_days: '35',
        relative_due_days: '84',
        tasks: [
          { title: 'Core development', position: 0, priority: 'high', visibility: 'internal', estimated_hours: 80, relative_due_days: '28' },
          { title: 'API integration', position: 1, priority: 'high', visibility: 'internal', estimated_hours: 32, relative_due_days: '35' },
          { title: 'Testing & debugging', position: 2, priority: 'high', visibility: 'internal', estimated_hours: 40, relative_due_days: '42' },
          { title: 'Performance optimization', position: 3, priority: 'medium', visibility: 'internal', estimated_hours: 16, relative_due_days: '49' }
        ]
      },
      {
        name: 'Deployment & Launch',
        description: 'App store submission and launch',
        position: 3,
        relative_start_days: '84',
        relative_due_days: '98',
        tasks: [
          { title: 'App store preparation', position: 0, priority: 'high', visibility: 'internal', estimated_hours: 8, relative_due_days: '7' },
          { title: 'Beta testing', position: 1, priority: 'high', visibility: 'client', estimated_hours: 12, relative_due_days: '10' },
          { title: 'Store submission', position: 2, priority: 'high', visibility: 'client', estimated_hours: 4, relative_due_days: '12' },
          { title: 'Launch support', position: 3, priority: 'medium', visibility: 'client', estimated_hours: 8, relative_due_days: '14' }
        ]
      }
    ]
  },
  {
    name: 'Consulting Engagement',
    description: 'Strategic consulting project with analysis and recommendations',
    color: 'orange',
    milestones: [
      {
        name: 'Discovery & Assessment',
        description: 'Client onboarding and situation analysis',
        position: 0,
        relative_start_days: '0',
        relative_due_days: '14',
        tasks: [
          { title: 'Stakeholder interviews', position: 0, priority: 'high', visibility: 'client', estimated_hours: 12, relative_due_days: '5' },
          { title: 'Current state analysis', position: 1, priority: 'high', visibility: 'internal', estimated_hours: 16, relative_due_days: '8' },
          { title: 'Data collection', position: 2, priority: 'medium', visibility: 'internal', estimated_hours: 10, relative_due_days: '10' },
          { title: 'Initial findings', position: 3, priority: 'high', visibility: 'client', estimated_hours: 6, relative_due_days: '14' }
        ]
      },
      {
        name: 'Analysis & Strategy',
        description: 'Deep analysis and strategy development',
        position: 1,
        relative_start_days: '14',
        relative_due_days: '35',
        tasks: [
          { title: 'Gap analysis', position: 0, priority: 'high', visibility: 'internal', estimated_hours: 20, relative_due_days: '7' },
          { title: 'Strategic framework', position: 1, priority: 'high', visibility: 'client', estimated_hours: 16, relative_due_days: '14' },
          { title: 'Solution design', position: 2, priority: 'high', visibility: 'internal', estimated_hours: 24, relative_due_days: '18' },
          { title: 'Recommendation development', position: 3, priority: 'high', visibility: 'client', estimated_hours: 12, relative_due_days: '21' }
        ]
      },
      {
        name: 'Implementation Planning',
        description: 'Implementation roadmap and change management',
        position: 2,
        relative_start_days: '35',
        relative_due_days: '49',
        tasks: [
          { title: 'Implementation roadmap', position: 0, priority: 'high', visibility: 'client', estimated_hours: 12, relative_due_days: '7' },
          { title: 'Change management plan', position: 1, priority: 'high', visibility: 'client', estimated_hours: 10, relative_due_days: '10' },
          { title: 'Risk mitigation', position: 2, priority: 'medium', visibility: 'client', estimated_hours: 8, relative_due_days: '12' },
          { title: 'Resource planning', position: 3, priority: 'medium', visibility: 'internal', estimated_hours: 6, relative_due_days: '14' }
        ]
      },
      {
        name: 'Delivery & Handover',
        description: 'Final delivery and knowledge transfer',
        position: 3,
        relative_start_days: '49',
        relative_due_days: '56',
        tasks: [
          { title: 'Final presentation', position: 0, priority: 'high', visibility: 'client', estimated_hours: 8, relative_due_days: '3' },
          { title: 'Knowledge transfer', position: 1, priority: 'high', visibility: 'client', estimated_hours: 6, relative_due_days: '5' },
          { title: 'Implementation support', position: 2, priority: 'medium', visibility: 'client', estimated_hours: 8, relative_due_days: '7' }
        ]
      }
    ]
  }
]

/**
 * Create a single template with milestones and tasks
 */
async function createTemplate(templateDef, adminUserId) {
  if (config.dryRun) {
    log.info(`DRY RUN: Would create template "${templateDef.name}" with ${templateDef.milestones.length} milestones`)
    return null
  }
  
  try {
    log.info(`Creating template: ${templateDef.name}`)
    
    // Create template
    const { data: template, error: templateError } = await serviceClient
      .from('service_templates')
      .insert({
        name: templateDef.name,
        description: templateDef.description,
        color: templateDef.color,
        created_by: adminUserId,
        is_default: true
      })
      .select()
      .single()
    
    if (templateError) throw templateError
    
    seedStats.templatesCreated++
    log.success(`  Template created: ${template.name}`)
    
    // Create milestones
    for (const milestoneDef of templateDef.milestones) {
      if (config.verbose) {
        log.info(`    Creating milestone: ${milestoneDef.name}`)
      }
      
      const { data: milestone, error: milestoneError } = await serviceClient
        .from('template_milestones')
        .insert({
          template_id: template.id,
          name: milestoneDef.name,
          description: milestoneDef.description,
          position: milestoneDef.position,
          relative_start_days: milestoneDef.relative_start_days,
          relative_due_days: milestoneDef.relative_due_days
        })
        .select()
        .single()
      
      if (milestoneError) throw milestoneError
      
      seedStats.milestonesCreated++
      
      // Create tasks
      for (const taskDef of milestoneDef.tasks) {
        const { error: taskError } = await serviceClient
          .from('template_tasks')
          .insert({
            template_milestone_id: milestone.id,
            title: taskDef.title,
            position: taskDef.position,
            priority: taskDef.priority,
            visibility: taskDef.visibility,
            estimated_hours: taskDef.estimated_hours,
            relative_due_days: taskDef.relative_due_days
          })
        
        if (taskError) throw taskError
        
        seedStats.tasksCreated++
      }
      
      if (config.verbose) {
        log.success(`      Created ${milestoneDef.tasks.length} tasks`)
      }
    }
    
    log.success(`  Completed: ${templateDef.milestones.length} milestones, ${templateDef.milestones.reduce((sum, m) => sum + m.tasks.length, 0)} tasks`)
    return template
    
  } catch (error) {
    seedStats.errors.push({ template: templateDef.name, error: error.message })
    log.error(`  Failed to create template ${templateDef.name}: ${error.message}`)
    throw error
  }
}

/**
 * Seed all default templates
 */
async function seedDefaultTemplates(adminUserId, existingTemplates) {
  log.header('SEEDING DEFAULT TEMPLATES')
  
  // Skip existing templates unless force mode
  const templatesToCreate = config.force 
    ? TEMPLATE_DEFINITIONS 
    : TEMPLATE_DEFINITIONS.filter(def => 
        !existingTemplates.some(existing => existing.name === def.name)
      )
  
  if (templatesToCreate.length === 0) {
    log.warning('All templates already exist. Use --force to recreate.')
    return
  }
  
  log.info(`Creating ${templatesToCreate.length} templates...`)
  
  for (const templateDef of templatesToCreate) {
    try {
      await createTemplate(templateDef, adminUserId)
    } catch (error) {
      if (config.verbose) {
        log.error(`Continuing despite error in ${templateDef.name}`)
      }
    }
  }
  
  // Count skipped templates
  seedStats.templatesSkipped = TEMPLATE_DEFINITIONS.length - templatesToCreate.length
}

/**
 * Validate seeded templates
 */
async function validateSeededTemplates() {
  log.header('VALIDATING SEEDED TEMPLATES')
  
  try {
    const { data: templates, error } = await serviceClient
      .from('template_summary')
      .select('*')
      .eq('is_default', true)
      .order('name')
    
    if (error) throw error
    
    log.info('Default templates in database:')
    templates.forEach(template => {
      log.success(`  ${template.name}: ${template.milestone_count}M/${template.task_count}T`)
    })
    
    return templates
    
  } catch (error) {
    log.error(`Validation failed: ${error.message}`)
    throw error
  }
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
${colors.bright}TEMPLATE SEEDING SCRIPT${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/seed-default-templates.js [options]

${colors.cyan}Options:${colors.reset}
  --force      Recreate templates even if they exist
  --clean      Remove existing default templates first
  --dry-run    Show what would be done without making changes
  --verbose    Show detailed progress information
  --help       Show this help message

${colors.cyan}Examples:${colors.reset}
  # Seed templates (skip existing)
  node scripts/seed-default-templates.js
  
  # Force recreate all templates
  node scripts/seed-default-templates.js --force
  
  # Clean and recreate templates
  node scripts/seed-default-templates.js --clean --force
  
  # Dry run to see what would happen
  node scripts/seed-default-templates.js --dry-run --verbose
`)
}

/**
 * Main execution function
 */
async function seedTemplates() {
  if (process.argv.includes('--help')) {
    printUsage()
    return
  }
  
  console.log(`${colors.bright}${colors.cyan}`)
  console.log('==================================================')
  console.log('PHASE 4 STEP 2: TEMPLATE SEEDING SCRIPT')
  console.log('Production-ready template seeding with safeguards')
  console.log('==================================================')
  console.log(colors.reset)
  
  if (config.dryRun) {
    log.warning('DRY RUN MODE - No changes will be made')
  }
  
  try {
    // Step 1: Validate environment
    const adminUser = await validateEnvironment()
    
    // Step 2: Check existing templates
    const existingTemplates = await checkExistingTemplates()
    if (existingTemplates === false) {
      return // Exit if templates exist and no force flag
    }
    
    // Step 3: Clean existing if requested
    if (config.clean) {
      await cleanExistingTemplates(existingTemplates)
    }
    
    // Step 4: Seed templates
    await seedDefaultTemplates(adminUser.id, existingTemplates || [])
    
    // Step 5: Validate results
    if (!config.dryRun) {
      await validateSeededTemplates()
    }
    
    // Step 6: Report results
    console.log(`\n${colors.bright}${colors.green}TEMPLATE SEEDING COMPLETED${colors.reset}`)
    console.log('==================================================')
    console.log(`✓ Templates created: ${seedStats.templatesCreated}`)
    console.log(`✓ Milestones created: ${seedStats.milestonesCreated}`)
    console.log(`✓ Tasks created: ${seedStats.tasksCreated}`)
    if (seedStats.templatesSkipped > 0) {
      console.log(`⚠ Templates skipped: ${seedStats.templatesSkipped}`)
    }
    if (seedStats.errors.length > 0) {
      console.log(`✗ Errors encountered: ${seedStats.errors.length}`)
      if (config.verbose) {
        seedStats.errors.forEach(err => {
          console.log(`  - ${err.template}: ${err.error}`)
        })
      }
    }
    console.log('==================================================')
    
  } catch (error) {
    log.error(`Template seeding failed: ${error.message}`)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  seedTemplates()
}

module.exports = { seedTemplates, TEMPLATE_DEFINITIONS, seedStats }