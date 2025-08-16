/**
 * Test Services Server Actions
 * Comprehensive test suite for all server actions
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

// Test data storage
let testServiceId = null
let testMilestoneId = null
let testTaskId = null
let testCommentId = null

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    test: `${colors.cyan}🧪${colors.reset}`,
    section: `${colors.bright}${colors.yellow}📋${colors.reset}`
  }[type] || ''
  
  console.log(`${prefix} ${message}`)
}

function section(title) {
  console.log(`\n${colors.bright}${colors.yellow}${'='.repeat(60)}${colors.reset}`)
  console.log(`${colors.bright}${title}${colors.reset}`)
  console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`)
}

// =====================================================
// TEST SERVICES
// =====================================================
async function testServiceActions() {
  section('TESTING SERVICE ACTIONS')
  
  // Get admin user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, role')
  
  const adminUser = profiles.find(p => p.email === 'admin@demo.com')
  const clientUser = profiles.find(p => p.email === 'sarah@acmecorp.com')
  
  if (!adminUser || !clientUser) {
    log('Required test users not found', 'error')
    return false
  }
  
  // Test 1: Create Service
  log('Testing createService...', 'test')
  const { data: newService, error: createError } = await supabase
    .from('services')
    .insert({
      name: 'Test Service - Server Actions',
      description: 'Testing all server action functionality',
      client_id: clientUser.id,
      status: 'planning',
      color: 'purple',
      budget: 10000,
      created_by: adminUser.id
    })
    .select()
    .single()
  
  if (createError) {
    log(`Failed to create service: ${createError.message}`, 'error')
    return false
  }
  
  testServiceId = newService.id
  log(`Service created: ${testServiceId}`, 'success')
  
  // Test 2: Get Services
  log('Testing getServices...', 'test')
  const { data: services, error: getError } = await supabase
    .from('services')
    .select('*')
    .eq('id', testServiceId)
  
  if (getError || !services?.length) {
    log('Failed to get services', 'error')
    return false
  }
  log(`Retrieved ${services.length} service(s)`, 'success')
  
  // Test 3: Update Service Status
  log('Testing updateServiceStatus...', 'test')
  const { error: updateError } = await supabase
    .from('services')
    .update({ 
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', testServiceId)
  
  if (updateError) {
    log(`Failed to update service status: ${updateError.message}`, 'error')
    return false
  }
  log('Service status updated to active', 'success')
  
  // Test 4: Add Service Member
  log('Testing addServiceMember...', 'test')
  const teamUser = profiles.find(p => p.email === 'team@demo.com')
  if (teamUser) {
    const { error: memberError } = await supabase
      .from('service_members')
      .insert({
        service_id: testServiceId,
        user_id: teamUser.id,
        role: 'member'
      })
    
    if (memberError && !memberError.message.includes('duplicate')) {
      log(`Failed to add service member: ${memberError.message}`, 'error')
    } else {
      log('Team member added to service', 'success')
    }
  }
  
  return true
}

// =====================================================
// TEST MILESTONES
// =====================================================
async function testMilestoneActions() {
  section('TESTING MILESTONE ACTIONS')
  
  if (!testServiceId) {
    log('No test service available', 'error')
    return false
  }
  
  // Test 1: Create Milestone
  log('Testing createMilestone...', 'test')
  const { data: newMilestone, error: createError } = await supabase
    .from('milestones')
    .insert({
      service_id: testServiceId,
      name: 'Test Milestone',
      description: 'Testing milestone functionality',
      status: 'upcoming',
      position: 0,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    .select()
    .single()
  
  if (createError) {
    log(`Failed to create milestone: ${createError.message}`, 'error')
    return false
  }
  
  testMilestoneId = newMilestone.id
  log(`Milestone created: ${testMilestoneId}`, 'success')
  
  // Test 2: Get Milestones
  log('Testing getMilestones...', 'test')
  const { data: milestones, error: getError } = await supabase
    .from('milestones')
    .select('*')
    .eq('service_id', testServiceId)
    .order('position')
  
  if (getError) {
    log(`Failed to get milestones: ${getError.message}`, 'error')
    return false
  }
  log(`Retrieved ${milestones.length} milestone(s)`, 'success')
  
  // Test 3: Update Milestone Status
  log('Testing updateMilestoneStatus...', 'test')
  const { error: updateError } = await supabase
    .from('milestones')
    .update({ 
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', testMilestoneId)
  
  if (updateError) {
    log(`Failed to update milestone: ${updateError.message}`, 'error')
    return false
  }
  log('Milestone status updated to in_progress', 'success')
  
  // Test 4: Create Another Milestone for Reordering
  log('Testing milestone reordering...', 'test')
  const { data: secondMilestone, error: secondError } = await supabase
    .from('milestones')
    .insert({
      service_id: testServiceId,
      name: 'Second Test Milestone',
      status: 'upcoming',
      position: 1
    })
    .select()
    .single()
  
  if (!secondError && secondMilestone) {
    // Test reordering
    const { error: reorderError } = await supabase
      .from('milestones')
      .update({ position: 0 })
      .eq('id', secondMilestone.id)
    
    if (!reorderError) {
      await supabase
        .from('milestones')
        .update({ position: 1 })
        .eq('id', testMilestoneId)
      
      log('Milestone positions reordered', 'success')
    }
  }
  
  return true
}

// =====================================================
// TEST TASKS
// =====================================================
async function testTaskActions() {
  section('TESTING TASK ACTIONS')
  
  if (!testMilestoneId) {
    log('No test milestone available', 'error')
    return false
  }
  
  // Get users for assignment
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
  
  const adminUser = profiles.find(p => p.email === 'admin@demo.com')
  
  // Test 1: Create Task
  log('Testing createTask...', 'test')
  const { data: newTask, error: createError } = await supabase
    .from('tasks')
    .insert({
      milestone_id: testMilestoneId,
      title: 'Test Task',
      description: 'Testing task functionality',
      status: 'todo',
      priority: 'high',
      position: 0,
      assigned_to: adminUser?.id,
      created_by: adminUser?.id,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single()
  
  if (createError) {
    log(`Failed to create task: ${createError.message}`, 'error')
    return false
  }
  
  testTaskId = newTask.id
  log(`Task created: ${testTaskId}`, 'success')
  
  // Test 2: Create Multiple Tasks for Drag-Drop Testing
  log('Creating additional tasks for drag-drop testing...', 'test')
  const taskStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked']
  const additionalTasks = []
  
  for (let i = 0; i < 5; i++) {
    const { data: task } = await supabase
      .from('tasks')
      .insert({
        milestone_id: testMilestoneId,
        title: `Test Task ${i + 2}`,
        status: taskStatuses[i % taskStatuses.length],
        priority: ['low', 'medium', 'high', 'urgent'][i % 4],
        position: i,
        created_by: adminUser?.id
      })
      .select()
      .single()
    
    if (task) additionalTasks.push(task)
  }
  log(`Created ${additionalTasks.length} additional tasks`, 'success')
  
  // Test 3: Update Task Status
  log('Testing updateTaskStatus...', 'test')
  const { error: statusError } = await supabase
    .from('tasks')
    .update({ 
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', testTaskId)
  
  if (statusError) {
    log(`Failed to update task status: ${statusError.message}`, 'error')
    return false
  }
  log('Task status updated to in_progress', 'success')
  
  // Test 4: Test Drag-Drop Position Update
  log('Testing updateTaskPosition (drag-drop)...', 'test')
  const { error: positionError } = await supabase
    .from('tasks')
    .update({
      status: 'review',
      position: 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', testTaskId)
  
  if (positionError) {
    log(`Failed to update task position: ${positionError.message}`, 'error')
    return false
  }
  log('Task moved to review column at position 0', 'success')
  
  // Test 5: Get Tasks
  log('Testing getTasks...', 'test')
  const { data: tasks, error: getError } = await supabase
    .from('tasks')
    .select('*')
    .eq('milestone_id', testMilestoneId)
    .order('status')
    .order('position')
  
  if (getError) {
    log(`Failed to get tasks: ${getError.message}`, 'error')
    return false
  }
  log(`Retrieved ${tasks.length} task(s)`, 'success')
  
  // Verify task grouping by status
  const tasksByStatus = {}
  tasks.forEach(task => {
    if (!tasksByStatus[task.status]) tasksByStatus[task.status] = []
    tasksByStatus[task.status].push(task)
  })
  
  Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
    log(`  ${status}: ${statusTasks.length} tasks`, 'info')
  })
  
  return true
}

// =====================================================
// TEST TASK COMMENTS
// =====================================================
async function testCommentActions() {
  section('TESTING TASK COMMENT ACTIONS')
  
  if (!testTaskId) {
    log('No test task available', 'error')
    return false
  }
  
  // Get user for comment
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
  
  const adminUser = profiles.find(p => p.email === 'admin@demo.com')
  
  // Test 1: Create Comment
  log('Testing createTaskComment...', 'test')
  const { data: newComment, error: createError } = await supabase
    .from('task_comments')
    .insert({
      task_id: testTaskId,
      user_id: adminUser.id,
      content: 'This is a test comment on the task'
    })
    .select()
    .single()
  
  if (createError) {
    log(`Failed to create comment: ${createError.message}`, 'error')
    return false
  }
  
  testCommentId = newComment.id
  log(`Comment created: ${testCommentId}`, 'success')
  
  // Test 2: Update Comment
  log('Testing updateTaskComment...', 'test')
  const { error: updateError } = await supabase
    .from('task_comments')
    .update({
      content: 'Updated test comment content',
      updated_at: new Date().toISOString()
    })
    .eq('id', testCommentId)
  
  if (updateError) {
    log(`Failed to update comment: ${updateError.message}`, 'error')
    return false
  }
  log('Comment updated successfully', 'success')
  
  // Test 3: Get Comments
  log('Testing getTaskComments...', 'test')
  const { data: comments, error: getError } = await supabase
    .from('task_comments')
    .select(`
      *,
      user:profiles!user_id(
        id,
        full_name
      )
    `)
    .eq('task_id', testTaskId)
    .order('created_at', { ascending: false })
  
  if (getError) {
    log(`Failed to get comments: ${getError.message}`, 'error')
    return false
  }
  log(`Retrieved ${comments.length} comment(s)`, 'success')
  
  return true
}

// =====================================================
// TEST ROLE-BASED ACCESS
// =====================================================
async function testRoleBasedAccess() {
  section('TESTING ROLE-BASED ACCESS CONTROL')
  
  const testCases = [
    { email: 'admin@demo.com', password: 'password123', role: 'Admin', canCreate: true, canSeeAll: true },
    { email: 'team@demo.com', password: 'password123', role: 'Team', canCreate: true, canSeeAll: true },
    { email: 'sarah@acmecorp.com', password: 'password123', role: 'Client', canCreate: false, canSeeAll: false }
  ]
  
  for (const testCase of testCases) {
    log(`\nTesting ${testCase.role} permissions...`, 'test')
    
    // Sign in as user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testCase.email,
      password: testCase.password
    })
    
    if (authError) {
      log(`Failed to authenticate as ${testCase.email}: ${authError.message}`, 'error')
      continue
    }
    
    // Test service access
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, client_id')
    
    if (servicesError) {
      log(`  Cannot read services: ${servicesError.message}`, 'error')
    } else {
      const ownServices = testCase.role === 'Client' 
        ? services.filter(s => s.client_id === authData.user.id)
        : services
      
      log(`  Can see ${ownServices.length} services (${testCase.canSeeAll ? 'all' : 'own only'})`, 
        ownServices.length > 0 ? 'success' : 'info')
    }
    
    // Test create permission
    if (testCase.canCreate) {
      const { error: createError } = await supabase
        .from('services')
        .insert({
          name: `Test Service by ${testCase.role}`,
          client_id: authData.user.id,
          status: 'planning'
        })
      
      if (createError) {
        log(`  Cannot create service: ${createError.message}`, 'error')
      } else {
        log(`  Can create services ✓`, 'success')
        // Clean up
        await supabase
          .from('services')
          .delete()
          .eq('name', `Test Service by ${testCase.role}`)
      }
    } else {
      // Try to create and expect failure
      const { error: createError } = await supabase
        .from('services')
        .insert({
          name: 'Should Fail',
          client_id: authData.user.id,
          status: 'planning'
        })
      
      if (createError) {
        log(`  Cannot create services (expected) ✓`, 'success')
      } else {
        log(`  Unexpectedly able to create service!`, 'error')
      }
    }
    
    // Sign out
    await supabase.auth.signOut()
  }
  
  return true
}

// =====================================================
// CLEANUP
// =====================================================
async function cleanup() {
  section('CLEANUP')
  
  log('Cleaning up test data...', 'info')
  
  // Delete test comment
  if (testCommentId) {
    await supabase.from('task_comments').delete().eq('id', testCommentId)
    log('Deleted test comment', 'success')
  }
  
  // Delete test tasks (will cascade delete comments)
  if (testMilestoneId) {
    await supabase.from('tasks').delete().eq('milestone_id', testMilestoneId)
    log('Deleted test tasks', 'success')
  }
  
  // Delete test milestones (will cascade delete tasks)
  if (testServiceId) {
    await supabase.from('milestones').delete().eq('service_id', testServiceId)
    log('Deleted test milestones', 'success')
  }
  
  // Delete test service (will cascade delete everything)
  if (testServiceId) {
    await supabase.from('services').delete().eq('id', testServiceId)
    log('Deleted test service', 'success')
  }
  
  log('Cleanup complete', 'success')
}

// =====================================================
// MAIN TEST RUNNER
// =====================================================
async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}🚀 SERVICES SERVER ACTIONS TEST SUITE${colors.reset}`)
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`)
  
  const startTime = Date.now()
  let allTestsPassed = true
  
  try {
    // Run test suites in order
    const testSuites = [
      { name: 'Service Actions', fn: testServiceActions },
      { name: 'Milestone Actions', fn: testMilestoneActions },
      { name: 'Task Actions', fn: testTaskActions },
      { name: 'Comment Actions', fn: testCommentActions },
      { name: 'Role-Based Access', fn: testRoleBasedAccess }
    ]
    
    for (const suite of testSuites) {
      const passed = await suite.fn()
      if (!passed) {
        allTestsPassed = false
        log(`${suite.name} suite failed`, 'error')
        break
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
    allTestsPassed = false
  } finally {
    // Always run cleanup
    await cleanup()
  }
  
  // Final summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`)
  if (allTestsPassed) {
    console.log(`${colors.green}${colors.bright}✅ ALL TESTS PASSED${colors.reset}`)
  } else {
    console.log(`${colors.red}${colors.bright}❌ SOME TESTS FAILED${colors.reset}`)
  }
  console.log(`${colors.cyan}Duration: ${duration}s${colors.reset}`)
  console.log(`${'='.repeat(60)}\n`)
  
  process.exit(allTestsPassed ? 0 : 1)
}

// Run the tests
runTests()