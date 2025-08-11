// Test that email integrations are properly hooked into services
console.log('Testing email integrations...\n')

const fs = require('fs')
const path = require('path')

function checkFileContains(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    if (content.includes(searchString)) {
      console.log(`✓ ${description}`)
      return true
    } else {
      console.log(`❌ ${description}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${description} - File not found: ${filePath}`)
    return false
  }
}

function testIntegrations() {
  console.log('1. Client Service Integration:')
  checkFileContains(
    path.join(__dirname, '../features/clients/services/clients.service.ts'),
    'sendClientWelcome',
    'Client service imports sendClientWelcome'
  )
  checkFileContains(
    path.join(__dirname, '../features/clients/services/clients.service.ts'),
    'sendClientWelcome(authData.user.id)',
    'Client service calls sendClientWelcome after creation'
  )
  
  console.log('\n2. Services Integration:')
  checkFileContains(
    path.join(__dirname, '../features/services/services/services.service.ts'),
    'sendMilestoneComplete',
    'Services service imports sendMilestoneComplete'
  )
  checkFileContains(
    path.join(__dirname, '../features/services/services/services.service.ts'),
    'sendMilestoneComplete(data.id)',
    'Services service calls sendMilestoneComplete on completion'
  )
  
  console.log('\n3. Tasks Integration:')
  checkFileContains(
    path.join(__dirname, '../features/tasks/services/tasks.service.ts'),
    'sendTaskAssigned',
    'Tasks service imports sendTaskAssigned'
  )
  checkFileContains(
    path.join(__dirname, '../features/tasks/services/tasks.service.ts'),
    'sendTaskAssigned(task.id)',
    'Tasks service calls sendTaskAssigned on creation'
  )
  checkFileContains(
    path.join(__dirname, '../features/tasks/services/tasks.service.ts'),
    'sendTaskAssigned(taskId)',
    'Tasks service calls sendTaskAssigned on assignment'
  )
  
  console.log('\n4. Email Templates Organization:')
  checkFileContains(
    path.join(__dirname, '../emails/templates/welcome.tsx'),
    'WelcomeEmail',
    'Welcome template exists in templates folder'
  )
  checkFileContains(
    path.join(__dirname, '../emails/templates/milestone-complete.tsx'),
    'MilestoneCompleteEmail',
    'Milestone template exists in templates folder'
  )
  checkFileContains(
    path.join(__dirname, '../emails/templates/task-assigned.tsx'),
    'TaskAssignedEmail',
    'Task template exists in templates folder'
  )
  
  console.log('\n5. Import Paths:')
  checkFileContains(
    path.join(__dirname, '../app/actions/email.ts'),
    '@/emails/templates/welcome',
    'Email service uses correct template paths'
  )
  checkFileContains(
    path.join(__dirname, '../emails/templates/welcome.tsx'),
    '../components/layout',
    'Templates use correct layout import path'
  )
  
  console.log('\n✅ Email integration testing complete!')
}

testIntegrations()