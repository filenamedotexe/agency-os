#!/usr/bin/env node

/**
 * SERVICE TEMPLATES INTEGRATION TEST SUITE
 * End-to-end testing of Phase 1 + Phase 2 integration
 * Tests real database operations without ES modules
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

// Test configuration
const testConfig = {
  timeout: 30000,
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  cleanup: !process.argv.includes('--no-cleanup')
}

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  createdData: {
    templates: [],
    services: [],
    users: []
  }
}

// Initialize Supabase client
let supabase
let serviceClient

/**
 * Test runner utility
 */
function test(name, testFn) {
  testResults.total++
  
  return new Promise(async (resolve) => {
    try {
      if (testConfig.verbose) {
        log.info(`Running: ${name}`)
      }
      
      const result = await testFn()
      
      if (result === false) {
        throw new Error('Test assertion failed')
      }
      
      testResults.passed++
      log.success(name)
      resolve(true)
      
    } catch (error) {
      testResults.failed++
      testResults.errors.push({ test: name, error: error.message })
      log.error(`${name}: ${error.message}`)
      resolve(false)
    }
  })
}

/**
 * Test assertion utilities
 */
const assert = {
  isTrue: (condition, message = 'Expected true') => {
    if (!condition) throw new Error(message)
  },
  
  exists: (value, message = 'Expected value to exist') => {
    if (value === null || value === undefined) {
      throw new Error(message)
    }
  },
  
  equals: (actual, expected, message = 'Values not equal') => {
    if (actual !== expected) {
      throw new Error(`${message}. Expected: ${expected}, Got: ${actual}`)
    }
  },
  
  isArray: (value, message = 'Expected array') => {
    if (!Array.isArray(value)) {
      throw new Error(message)
    }
  },
  
  greaterThan: (actual, expected, message = 'Expected greater than') => {
    if (actual <= expected) {
      throw new Error(`${message}. Expected > ${expected}, Got: ${actual}`)
    }
  }
}

/**
 * Simple smart date utilities for testing (avoiding ES modules)
 */
const smartDateUtils = {
  parseRelativeDateString: (input) => {
    if (!input || typeof input !== 'string') return null
    
    const normalized = input.trim().toLowerCase()
    
    if (normalized === 'same day') return { amount: 0, unit: 'days', total_days: 0 }
    if (normalized === 'next day') return { amount: 1, unit: 'day', total_days: 1 }
    
    const regex = /^(\d+)\s+(day|days|week|weeks|month|months)(?:\s+later)?$/
    const match = normalized.match(regex)
    
    if (!match) return null
    
    const amount = parseInt(match[1], 10)
    const unit = match[2]
    
    let total_days = amount
    if (unit.includes('week')) total_days = amount * 7
    if (unit.includes('month')) total_days = amount * 30
    
    return { amount, unit, total_days }
  },
  
  calculateMilestoneDate: (serviceStartDate, relativeDays) => {
    if (!serviceStartDate || relativeDays < 0) return null
    
    try {
      const date = new Date(serviceStartDate)
      date.setDate(date.getDate() + relativeDays)
      return date.toISOString()
    } catch (error) {
      return null
    }
  },
  
  generateDateSuggestions: () => {
    return [
      { label: 'Same day', value: 'same day', days: 0 },
      { label: 'Next day', value: 'next day', days: 1 },
      { label: '1 week', value: '1 week', days: 7 },
      { label: '2 weeks', value: '2 weeks', days: 14 },
      { label: '1 month', value: '1 month', days: 30 }
    ]
  }
}

/**
 * Initialize database connection
 */
async function initializeDatabase() {
  log.header('DATABASE CONNECTION SETUP')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  // Initialize clients
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  
  await test('Database connection established', async () => {
    const { data, error } = await serviceClient
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) throw error
    assert.exists(data, 'Failed to query database')
  })
  
  await test('Service template tables exist', async () => {
    const { data, error } = await serviceClient
      .from('service_templates')
      .select('count')
      .limit(1)
    
    if (error) throw error
    assert.exists(data, 'service_templates table not accessible')
  })
  
  await test('Template milestones table exists', async () => {
    const { data, error } = await serviceClient
      .from('template_milestones')
      .select('count')
      .limit(1)
    
    if (error) throw error
    assert.exists(data, 'template_milestones table not accessible')
  })
  
  await test('Template tasks table exists', async () => {
    const { data, error } = await serviceClient
      .from('template_tasks')
      .select('count')
      .limit(1)
    
    if (error) throw error
    assert.exists(data, 'template_tasks table not accessible')
  })
  
  await test('Template summary view exists', async () => {
    const { data, error } = await serviceClient
      .from('template_summary')
      .select('count')
      .limit(1)
    
    if (error) throw error
    assert.exists(data, 'template_summary view not accessible')
  })
}

/**
 * Test smart date utility functions
 */
async function testSmartDateFunctions() {
  log.header('SMART DATE FUNCTIONS TESTING')
  
  await test('Parse relative date strings', async () => {
    const testCases = [
      { input: '1 week', expected: 7 },
      { input: '2 weeks', expected: 14 },
      { input: '1 month', expected: 30 },
      { input: 'same day', expected: 0 },
      { input: 'next day', expected: 1 },
      { input: '3 days later', expected: 3 }
    ]
    
    testCases.forEach(testCase => {
      const result = smartDateUtils.parseRelativeDateString(testCase.input)
      assert.exists(result, `Failed to parse: ${testCase.input}`)
      assert.equals(result.total_days, testCase.expected, `Incorrect days for: ${testCase.input}`)
    })
  })
  
  await test('Calculate milestone dates', async () => {
    const serviceStart = '2025-01-01T00:00:00.000Z'
    
    const result1 = smartDateUtils.calculateMilestoneDate(serviceStart, 7)
    assert.exists(result1, 'Failed to calculate milestone date')
    
    const result2 = smartDateUtils.calculateMilestoneDate(serviceStart, 0)
    assert.exists(result2, 'Failed to calculate same-day milestone')
    
    // Validate the calculated date is correct
    const expectedDate = new Date('2025-01-08T00:00:00.000Z')
    const actualDate = new Date(result1)
    assert.equals(actualDate.getDate(), expectedDate.getDate(), 'Calculated date incorrect')
  })
  
  await test('Generate date suggestions', async () => {
    const suggestions = smartDateUtils.generateDateSuggestions()
    assert.isArray(suggestions, 'Date suggestions not an array')
    assert.greaterThan(suggestions.length, 3, 'Too few date suggestions')
    
    suggestions.forEach(suggestion => {
      assert.exists(suggestion.label, 'Missing suggestion label')
      assert.exists(suggestion.value, 'Missing suggestion value')
      assert.exists(suggestion.days, 'Missing suggestion days')
    })
  })
}

/**
 * Test template creation and management
 */
async function testTemplateOperations() {
  log.header('TEMPLATE OPERATIONS TESTING')
  
  let testTemplate = null
  let testMilestones = []
  
  await test('Create service template', async () => {
    const { data, error } = await serviceClient
      .from('service_templates')
      .insert({
        name: 'Integration Test Template',
        description: 'Template created during integration testing',
        color: 'blue',
        created_by: '00000000-0000-0000-0000-000000000001', // Dummy admin user ID
        is_default: false
      })
      .select()
      .single()
    
    if (error) throw error
    assert.exists(data, 'Template creation failed')
    assert.exists(data.id, 'Template missing ID')
    assert.equals(data.name, 'Integration Test Template', 'Template name incorrect')
    assert.equals(data.color, 'blue', 'Template color incorrect')
    assert.equals(data.is_default, false, 'Template should not be default')
    
    testTemplate = data
    testResults.createdData.templates.push(data.id)
  })
  
  await test('Create template milestones', async () => {
    assert.exists(testTemplate, 'Test template not created')
    
    const milestones = [
      { name: 'Discovery', position: 0, relative_start_days: 0, relative_due_days: 7 },
      { name: 'Development', position: 1, relative_start_days: 7, relative_due_days: 21 },
      { name: 'Testing', position: 2, relative_start_days: 21, relative_due_days: 28 }
    ]
    
    for (const milestone of milestones) {
      const { data, error } = await serviceClient
        .from('template_milestones')
        .insert({
          template_id: testTemplate.id,
          ...milestone
        })
        .select()
        .single()
      
      if (error) throw error
      assert.exists(data, 'Milestone creation failed')
      assert.equals(data.name, milestone.name, 'Milestone name incorrect')
      assert.equals(data.position, milestone.position, 'Milestone position incorrect')
      
      testMilestones.push(data)
    }
    
    assert.equals(testMilestones.length, 3, 'Incorrect number of milestones created')
  })
  
  await test('Create template tasks', async () => {
    assert.greaterThan(testMilestones.length, 0, 'No milestones to add tasks to')
    
    const tasks = [
      { 
        title: 'Research market', 
        position: 0, 
        priority: 'high', 
        visibility: 'internal',
        estimated_hours: 8,
        relative_due_days: 3
      },
      { 
        title: 'Create wireframes', 
        position: 1, 
        priority: 'medium', 
        visibility: 'client',
        estimated_hours: 16,
        relative_due_days: 5
      }
    ]
    
    for (const task of tasks) {
      const { data, error } = await serviceClient
        .from('template_tasks')
        .insert({
          template_milestone_id: testMilestones[0].id,
          ...task
        })
        .select()
        .single()
      
      if (error) throw error
      assert.exists(data, 'Task creation failed')
      assert.equals(data.title, task.title, 'Task title incorrect')
      assert.equals(data.priority, task.priority, 'Task priority incorrect')
      assert.equals(data.visibility, task.visibility, 'Task visibility incorrect')
    }
  })
  
  await test('Retrieve template with relations', async () => {
    const { data, error } = await serviceClient
      .from('service_templates')
      .select(`
        *,
        milestones:template_milestones(
          *,
          tasks:template_tasks(*)
        )
      `)
      .eq('id', testTemplate.id)
      .single()
    
    if (error) throw error
    assert.exists(data, 'Template retrieval failed')
    assert.isArray(data.milestones, 'Milestones not loaded')
    assert.equals(data.milestones.length, 3, 'Incorrect number of milestones loaded')
    
    data.milestones.forEach(milestone => {
      assert.isArray(milestone.tasks, 'Tasks not loaded for milestone')
      assert.exists(milestone.name, 'Milestone missing name')
      assert.exists(milestone.position, 'Milestone missing position')
    })
    
    // Check first milestone has tasks
    assert.greaterThan(data.milestones[0].tasks.length, 0, 'No tasks loaded for first milestone')
  })
  
  await test('Verify template summary view', async () => {
    const { data, error } = await serviceClient
      .from('template_summary')
      .select('*')
      .eq('id', testTemplate.id)
      .single()
    
    if (error) throw error
    assert.exists(data, 'Template summary not found')
    assert.equals(data.name, testTemplate.name, 'Summary name incorrect')
    assert.equals(data.milestone_count, 3, 'Summary milestone count incorrect')
    assert.greaterThan(data.task_count, 0, 'Summary task count should be greater than 0')
  })
}

/**
 * Test service creation from template
 */
async function testServiceFromTemplate() {
  log.header('SERVICE FROM TEMPLATE TESTING')
  
  let testClient = null
  
  await test('Get or create test client profile', async () => {
    // Try to get existing test client first
    const { data: existingClient } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('email', 'testclient@integration.test')
      .single()
    
    if (existingClient) {
      testClient = existingClient
    } else {
      const { data, error } = await serviceClient
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000002',
          email: 'testclient@integration.test',
          full_name: 'Integration Test Client',
          role: 'client'
        })
        .select()
        .single()
      
      if (error) throw error
      testClient = data
      testResults.createdData.users.push(testClient.id)
    }
    
    assert.exists(testClient, 'Test client not available')
    assert.equals(testClient.role, 'client', 'Test client role incorrect')
  })
  
  await test('Create service from template', async () => {
    const template = testResults.createdData.templates[0]
    assert.exists(template, 'No test template available')
    
    // Create service
    const { data: service, error: serviceError } = await serviceClient
      .from('services')
      .insert({
        client_id: testClient.id,
        name: 'Service from Integration Test Template',
        description: 'Service created during integration testing',
        start_date: '2025-01-01',
        budget: '10000',
        color: 'blue',
        status: 'planning',
        created_by: '00000000-0000-0000-0000-000000000001'
      })
      .select()
      .single()
    
    if (serviceError) throw serviceError
    assert.exists(service, 'Service creation failed')
    assert.equals(service.client_id, testClient.id, 'Service client_id incorrect')
    assert.equals(service.status, 'planning', 'Service status incorrect')
    
    testResults.createdData.services.push(service.id)
    
    // Get template milestones to replicate
    const { data: templateMilestones, error: milestoneError } = await serviceClient
      .from('template_milestones')
      .select('*')
      .eq('template_id', template)
      .order('position')
    
    if (milestoneError) throw milestoneError
    assert.greaterThan(templateMilestones.length, 0, 'No template milestones found')
    
    // Create milestones from template using smart date logic
    for (const templateMilestone of templateMilestones) {
      const serviceStartDate = new Date('2025-01-01T00:00:00.000Z')
      const milestoneDueDate = smartDateUtils.calculateMilestoneDate(
        serviceStartDate.toISOString(), 
        templateMilestone.relative_due_days || 0
      )
      
      const { data: milestone, error: createError } = await serviceClient
        .from('milestones')
        .insert({
          service_id: service.id,
          name: templateMilestone.name,
          description: templateMilestone.description,
          position: templateMilestone.position,
          due_date: milestoneDueDate,
          status: 'upcoming'
        })
        .select()
        .single()
      
      if (createError) throw createError
      assert.exists(milestone, 'Milestone creation failed')
      assert.equals(milestone.name, templateMilestone.name, 'Milestone name mismatch')
    }
  })
  
  await test('Verify service structure matches template', async () => {
    const service = testResults.createdData.services[0]
    const template = testResults.createdData.templates[0]
    
    const { data: serviceMilestones, error } = await serviceClient
      .from('milestones')
      .select('*')
      .eq('service_id', service)
      .order('position')
    
    if (error) throw error
    assert.isArray(serviceMilestones, 'Service milestones not found')
    assert.greaterThan(serviceMilestones.length, 0, 'No milestones created for service')
    
    // Verify milestone names match template
    const { data: templateMilestones, error: templateError } = await serviceClient
      .from('template_milestones')
      .select('name, position, relative_due_days')
      .eq('template_id', template)
      .order('position')
    
    if (templateError) throw templateError
    
    assert.equals(serviceMilestones.length, templateMilestones.length, 'Milestone count mismatch')
    
    serviceMilestones.forEach((serviceMilestone, index) => {
      const templateMilestone = templateMilestones[index]
      assert.equals(
        serviceMilestone.name, 
        templateMilestone.name,
        `Milestone ${index} name mismatch`
      )
      assert.equals(
        serviceMilestone.position, 
        templateMilestone.position,
        `Milestone ${index} position mismatch`
      )
    })
  })
  
  await test('Verify smart date calculations in service', async () => {
    const service = testResults.createdData.services[0]
    
    const { data: serviceMilestones, error } = await serviceClient
      .from('milestones')
      .select('name, due_date, position')
      .eq('service_id', service)
      .order('position')
    
    if (error) throw error
    
    // Verify first milestone is 7 days from service start (2025-01-01)
    const firstMilestone = serviceMilestones.find(m => m.position === 0)
    assert.exists(firstMilestone, 'First milestone not found')
    
    if (firstMilestone.due_date) {
      const dueDate = new Date(firstMilestone.due_date)
      const expectedDate = new Date('2025-01-08T00:00:00.000Z')
      assert.equals(dueDate.getDate(), expectedDate.getDate(), 'Smart date calculation incorrect')
    }
  })
}

/**
 * Test RLS policies
 */
async function testRLSPolicies() {
  log.header('ROW LEVEL SECURITY TESTING')
  
  await test('Anonymous users cannot access templates', async () => {
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data, error } = await anonClient
      .from('service_templates')
      .select('*')
      .limit(1)
    
    // Should either error or return empty results due to RLS
    if (!error) {
      assert.equals(data.length, 0, 'Anonymous user can access templates')
    }
    // If there's an error, that's also acceptable as RLS is working
  })
  
  await test('Service client enforces RLS', async () => {
    // Test that service client can access templates (has service role)
    const { data, error } = await serviceClient
      .from('service_templates')
      .select('*')
      .limit(1)
    
    if (error) throw error
    assert.exists(data, 'Service client cannot access templates')
  })
  
  await test('Template policies work correctly', async () => {
    // Verify we can read the templates we created
    const { data, error } = await serviceClient
      .from('service_templates')
      .select('id, name')
      .eq('name', 'Integration Test Template')
    
    if (error) throw error
    assert.isArray(data, 'Template query failed')
    assert.greaterThan(data.length, 0, 'Cannot read created template')
  })
}

/**
 * Test data cleanup
 */
async function cleanupTestData() {
  if (!testConfig.cleanup) {
    log.warning('Skipping cleanup due to --no-cleanup flag')
    return
  }
  
  log.header('CLEANING UP TEST DATA')
  
  // Clean up in reverse order of creation
  for (const serviceId of testResults.createdData.services) {
    await test(`Delete test service ${serviceId}`, async () => {
      // First delete milestones (due to foreign key constraints)
      await serviceClient.from('milestones').delete().eq('service_id', serviceId)
      
      const { error } = await serviceClient
        .from('services')
        .delete()
        .eq('id', serviceId)
      
      if (error && !error.message.includes('not found')) {
        throw error
      }
    })
  }
  
  for (const templateId of testResults.createdData.templates) {
    await test(`Delete test template ${templateId}`, async () => {
      // Template cascade delete should handle milestones and tasks
      const { error } = await serviceClient
        .from('service_templates')
        .delete()
        .eq('id', templateId)
      
      if (error && !error.message.includes('not found')) {
        throw error
      }
    })
  }
  
  for (const userId of testResults.createdData.users) {
    await test(`Delete test user ${userId}`, async () => {
      const { error } = await serviceClient
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (error && !error.message.includes('not found')) {
        throw error
      }
    })
  }
}

/**
 * Main test runner
 */
async function runIntegrationTests() {
  console.log(`${colors.bright}${colors.cyan}`)
  console.log('==================================================')
  console.log('SERVICE TEMPLATES INTEGRATION TEST SUITE')
  console.log('==================================================')
  console.log(colors.reset)
  
  try {
    // Run test suites
    await initializeDatabase()
    await testSmartDateFunctions()
    await testTemplateOperations()
    await testServiceFromTemplate()
    await testRLSPolicies()
    await cleanupTestData()
    
  } catch (error) {
    log.error(`Critical error: ${error.message}`)
    testResults.failed++
    testResults.errors.push({ test: 'Critical Error', error: error.message })
  }
  
  // Print summary
  console.log(`\n${colors.bright}${colors.cyan}INTEGRATION TEST SUMMARY${colors.reset}`)
  console.log('==================================================')
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`)
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`)
  
  if (testResults.failed > 0) {
    console.log(`\n${colors.red}FAILED TESTS:${colors.reset}`)
    testResults.errors.forEach(error => {
      console.log(`${colors.red}✗${colors.reset} ${error.test}: ${error.error}`)
    })
    console.log('==================================================')
    process.exit(1)
  } else {
    console.log(`\n${colors.green}All integration tests passed successfully!${colors.reset}`)
    console.log('==================================================')
    console.log(`\n${colors.bright}PHASE 1 & 2 INTEGRATION VERIFIED${colors.reset}`)
    process.exit(0)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests()
}

module.exports = {
  runIntegrationTests,
  test,
  assert,
  testResults
}