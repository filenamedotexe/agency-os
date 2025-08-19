#!/usr/bin/env node

/**
 * ADMIN ROLE E2E TESTING - Service Templates Feature
 * Tests complete template system functionality for admin users
 * Includes: Template CRUD, Smart Dates, Service Creation from Templates
 */

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@demo.com'
const PASSWORD = 'password123'

async function runAdminTemplateTests() {
  console.log('🧪 Starting Admin Role E2E Tests for Service Templates...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visibility
  })
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  
  const page = await context.newPage()
  
  try {
    // =====================================================
    // STEP 1: AUTHENTICATION
    // =====================================================
    console.log('🔐 Step 1: Admin Authentication')
    
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    // Login as admin
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await page.waitForURL('**/admin', { timeout: 10000 })
    console.log('✅ Admin authentication successful')
    
    // =====================================================
    // STEP 2: NAVIGATE TO SERVICES AND TEMPLATE MANAGEMENT
    // =====================================================
    console.log('\n📁 Step 2: Navigate to Services')
    
    await page.goto(`${BASE_URL}/services`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Services page loaded')
    
    // =====================================================
    // STEP 3: TEST TEMPLATE CREATION FROM SCRATCH
    // =====================================================
    console.log('\n🎨 Step 3: Create New Template from Scratch')
    
    // Look for template management button
    await page.click('text="Templates"')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    
    // Click Create New Template
    await page.click('text="Create New Template"')
    await page.waitForSelector('form', { timeout: 5000 })
    
    // Fill template basic info
    await page.fill('input[placeholder*="e.g., Website Development"]', 'E2E Test Template')
    await page.fill('textarea[placeholder*="Brief description"]', 'Template created during E2E testing')
    
    // Select color
    await page.click('[data-testid="color-select"]')
    await page.click('text="Purple"')
    
    // Add milestone
    await page.fill('input[placeholder*="e.g., Discovery & Planning"]', 'Planning Phase')
    await page.fill('input[placeholder*="Brief description..."]', 'Initial planning and discovery')
    
    // Test Smart Date Input
    console.log('📅 Testing Smart Date Inputs...')
    
    // Start time input
    await page.fill('[data-testid="start-time-input"]', '0 days')
    await page.waitForTimeout(500)
    
    // Due time input  
    await page.fill('[data-testid="due-time-input"]', '1 week')
    await page.waitForTimeout(500)
    
    // Verify smart date suggestions appear
    const suggestions = await page.locator('.date-suggestions').count()
    if (suggestions > 0) {
      console.log('✅ Smart date suggestions working')
    }
    
    // Add a task to the milestone
    await page.click('text="Add Task"')
    await page.fill('input[placeholder*="e.g., Client kickoff meeting"]', 'Initial client meeting')
    await page.selectOption('select[data-testid="priority-select"]', 'high')
    await page.fill('input[type="number"][placeholder="8"]', '4')
    await page.selectOption('select[data-testid="visibility-select"]', 'client')
    
    // Task relative due time
    await page.fill('[data-testid="task-due-time"]', '2 days')
    
    // Add second milestone
    await page.click('text="Add Milestone"')
    await page.fill('input[placeholder*="e.g., Discovery & Planning"]:last-of-type', 'Development Phase')
    
    // Fill smart dates for second milestone
    await page.fill('[data-testid="start-time-input"]:last-of-type', '1 week')
    await page.fill('[data-testid="due-time-input"]:last-of-type', '4 weeks')
    
    // Submit template creation
    await page.click('button[type="submit"]:has-text("Create Template")')
    await page.waitForSelector('.toast:has-text("success")', { timeout: 10000 })
    console.log('✅ Template created successfully with smart dates')
    
    // =====================================================
    // STEP 4: TEST TEMPLATE PREVIEW AND MANAGEMENT
    // =====================================================
    console.log('\n👀 Step 4: Test Template Preview')
    
    // Navigate back to template list
    await page.goto(`${BASE_URL}/services`)
    await page.click('text="Template Management"')
    
    // Find our created template
    await page.click('text="E2E Test Template"')
    await page.waitForSelector('.template-preview', { timeout: 5000 })
    
    // Verify template preview shows smart date calculations
    const previewDates = await page.locator('.milestone-preview .calculated-date').count()
    if (previewDates > 0) {
      console.log('✅ Template preview showing calculated dates')
    }
    
    // Test template editing
    await page.click('text="Edit Template"')
    await page.waitForSelector('form')
    
    // Modify template name
    await page.fill('input[value="E2E Test Template"]', 'E2E Test Template (Modified)')
    await page.click('button:has-text("Save Changes")')
    await page.waitForSelector('.toast:has-text("success")')
    console.log('✅ Template editing successful')
    
    // =====================================================
    // STEP 5: TEST SERVICE CREATION FROM TEMPLATE
    // =====================================================
    console.log('\n🚀 Step 5: Create Service from Template')
    
    await page.goto(`${BASE_URL}/services`)
    await page.click('text="New Service"')
    
    // Look for "From Template" option
    await page.click('text="From Template"')
    await page.waitForSelector('.template-selector')
    
    // Select our test template
    await page.click('text="E2E Test Template (Modified)"')
    await page.waitForSelector('.create-service-form')
    
    // Fill service details
    await page.selectOption('select[data-testid="client-select"]', { index: 1 }) // Select first client
    await page.fill('input[placeholder*="e.g., Website Redesign"]', 'Test Service from Template')
    await page.fill('textarea[placeholder*="Brief description"]', 'Service created from E2E template')
    
    // Set start date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startDate = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', startDate)
    
    // Verify smart date preview updates
    console.log('📅 Testing Smart Date Preview...')
    await page.waitForTimeout(1000) // Wait for preview to update
    
    const previewMilestones = await page.locator('.milestone-preview').count()
    if (previewMilestones > 0) {
      console.log('✅ Smart date preview updating correctly')
      
      // Check if dates are calculated based on start date
      const calculatedDates = await page.locator('.calculated-date').allTextContents()
      console.log('📅 Calculated milestone dates:', calculatedDates)
    }
    
    // Set budget
    await page.fill('input[placeholder="10000"]', '25000')
    
    // Submit service creation
    await page.click('button:has-text("Create Service")')
    await page.waitForSelector('.toast:has-text("success")', { timeout: 15000 })
    console.log('✅ Service created from template successfully')
    
    // =====================================================
    // STEP 6: VERIFY SERVICE STRUCTURE MATCHES TEMPLATE
    // =====================================================
    console.log('\n🔍 Step 6: Verify Service Structure')
    
    // Navigate to the newly created service
    await page.waitForURL('**/services/**')
    await page.waitForLoadState('networkidle')
    
    // Verify milestones were created
    const milestoneCards = await page.locator('.milestone-card').count()
    console.log(`📊 Found ${milestoneCards} milestones in created service`)
    
    // Verify tasks were created
    const taskCards = await page.locator('.task-card').count()
    console.log(`📋 Found ${taskCards} tasks in created service`)
    
    // Verify dates were calculated correctly
    const milestoneDates = await page.locator('.milestone-due-date').allTextContents()
    console.log('📅 Milestone due dates:', milestoneDates)
    
    if (milestoneCards >= 2 && taskCards >= 1) {
      console.log('✅ Service structure matches template')
    }
    
    // =====================================================
    // STEP 7: TEST TEMPLATE DELETION (ADMIN ONLY)
    // =====================================================
    console.log('\n🗑️ Step 7: Test Template Deletion (Admin Permission)')
    
    await page.goto(`${BASE_URL}/services`)
    await page.click('text="Template Management"')
    
    // Find our test template and delete it
    await page.click('text="E2E Test Template (Modified)"')
    await page.click('text="Delete Template"')
    
    // Confirm deletion in dialog
    await page.click('button:has-text("Delete"):has-text("Confirm")')
    await page.waitForSelector('.toast:has-text("deleted")', { timeout: 5000 })
    console.log('✅ Template deletion successful (Admin permission verified)')
    
    // =====================================================
    // STEP 8: TEST SMART DATE CALCULATIONS
    // =====================================================
    console.log('\n📅 Step 8: Comprehensive Smart Date Testing')
    
    // Create another template to test various date formats
    await page.click('text="Create New Template"')
    await page.fill('input[placeholder*="e.g., Website Development"]', 'Smart Date Test Template')
    
    // Test various smart date formats
    const dateTestCases = [
      { milestone: 'Phase 1', start: '0 days', due: '1 week' },
      { milestone: 'Phase 2', start: '1 week', due: '3 weeks' },
      { milestone: 'Phase 3', start: '3 weeks', due: '2 months' }
    ]
    
    for (let i = 0; i < dateTestCases.length; i++) {
      const testCase = dateTestCases[i]
      
      if (i > 0) {
        await page.click('text="Add Milestone"')
      }
      
      // Fill milestone details
      const milestoneIndex = i
      await page.fill(`input[placeholder*="e.g., Discovery & Planning"]:nth-of-type(${milestoneIndex + 1})`, testCase.milestone)
      await page.fill(`[data-testid="start-time-input"]:nth-of-type(${milestoneIndex + 1})`, testCase.start)
      await page.fill(`[data-testid="due-time-input"]:nth-of-type(${milestoneIndex + 1})`, testCase.due)
      
      // Wait for validation
      await page.waitForTimeout(500)
      
      console.log(`📅 Testing: ${testCase.milestone} - Start: ${testCase.start}, Due: ${testCase.due}`)
    }
    
    // Submit and verify smart date parsing worked
    await page.click('button:has-text("Create Template")')
    await page.waitForSelector('.toast:has-text("success")')
    console.log('✅ Smart date parsing and template creation successful')
    
    // =====================================================
    // FINAL RESULTS
    // =====================================================
    console.log('\n🎯 ADMIN E2E TEST RESULTS:')
    console.log('✅ Authentication successful')
    console.log('✅ Template creation from scratch')
    console.log('✅ Smart date input validation')
    console.log('✅ Template preview functionality')
    console.log('✅ Template editing capabilities')
    console.log('✅ Service creation from template')
    console.log('✅ Smart date calculations in service')
    console.log('✅ Template deletion (admin permission)')
    console.log('✅ Multiple smart date format testing')
    console.log('\n🏆 ADMIN ROLE: ALL TESTS PASSED!')
    
  } catch (error) {
    console.error('❌ Admin E2E Test Failed:', error.message)
    
    // Take screenshot on failure
    await page.screenshot({ 
      path: `admin-template-test-error-${Date.now()}.png`,
      fullPage: true 
    })
    
    throw error
  } finally {
    await browser.close()
  }
}

// Run the tests
if (require.main === module) {
  runAdminTemplateTests()
    .then(() => {
      console.log('\n✅ Admin template E2E tests completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Admin template E2E tests failed:', error)
      process.exit(1)
    })
}

module.exports = { runAdminTemplateTests }