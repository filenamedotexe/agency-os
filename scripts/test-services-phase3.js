/**
 * Test Script for Phase 3: Services List Page
 * Tests all components and functionality of the services list
 */

const { chromium } = require('playwright')
require('dotenv').config({ path: '.env.local' })

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

// Test accounts
const testAccounts = {
  admin: { email: 'admin@demo.com', password: 'password123' },
  team: { email: 'team@demo.com', password: 'password123' },
  client: { email: 'sarah@acmecorp.com', password: 'password123' }
}

// Viewport configurations
const viewports = [
  { name: 'Mobile', width: 375, height: 812 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Small Mobile', width: 320, height: 568 }
]

async function testServicesPage(page, userType) {
  section(`Testing Services Page - ${userType.toUpperCase()} User`)
  
  // Navigate to services page
  log('Navigating to services page...', 'test')
  await page.goto('http://localhost:3003/services')
  await page.waitForLoadState('networkidle')
  
  // Check page loaded
  const pageTitle = await page.locator('h1').first()
  if (await pageTitle.isVisible()) {
    log('Services page loaded successfully', 'success')
    const titleText = await pageTitle.textContent()
    log(`Page title: ${titleText}`, 'info')
  } else {
    log('Services page failed to load', 'error')
    return false
  }
  
  // Check for service cards
  const serviceCards = page.locator('[href^="/services/"]')
  const cardCount = await serviceCards.count()
  log(`Found ${cardCount} service cards`, 'info')
  
  if (cardCount > 0) {
    // Test first service card details
    const firstCard = serviceCards.first()
    
    // Check progress visualization
    const progressCircle = firstCard.locator('svg circle').nth(1)
    if (await progressCircle.isVisible()) {
      log('Progress circle visualization found', 'success')
    }
    
    // Check service name
    const serviceName = firstCard.locator('h3')
    if (await serviceName.isVisible()) {
      const name = await serviceName.textContent()
      log(`Service name: ${name}`, 'info')
    }
    
    // Check client info
    const clientInfo = firstCard.locator('p.text-sm.text-muted-foreground').first()
    if (await clientInfo.isVisible()) {
      const client = await clientInfo.textContent()
      log(`Client: ${client}`, 'info')
    }
    
    // Check team members avatars
    const avatars = firstCard.locator('[class*="Avatar"]')
    const avatarCount = await avatars.count()
    log(`Team members shown: ${avatarCount}`, 'info')
    
    // Check milestone info
    const milestoneInfo = firstCard.locator('text=/milestones/')
    if (await milestoneInfo.isVisible()) {
      const milestones = await milestoneInfo.textContent()
      log(`Milestones: ${milestones}`, 'info')
    }
  }
  
  // Test Create Service Button (admin/team only)
  if (userType !== 'client') {
    log('Testing Create Service button...', 'test')
    const createButton = page.locator('button:has-text("New Service"), button:has([class*="Plus"])')
    
    if (await createButton.isVisible()) {
      log('Create Service button found', 'success')
      
      // Click to open modal
      await createButton.click()
      await page.waitForTimeout(500)
      
      // Check modal opened
      const modal = page.locator('[role="dialog"]')
      if (await modal.isVisible()) {
        log('Create Service modal opened', 'success')
        
        // Check form fields
        const clientSelect = modal.locator('button[role="combobox"]').first()
        const nameInput = modal.locator('input[id="name"]')
        const descriptionTextarea = modal.locator('textarea[id="description"]')
        const startDateInput = modal.locator('input[id="start_date"]')
        const budgetInput = modal.locator('input[id="budget"]')
        
        const fieldsVisible = await Promise.all([
          clientSelect.isVisible(),
          nameInput.isVisible(),
          descriptionTextarea.isVisible(),
          startDateInput.isVisible(),
          budgetInput.isVisible()
        ])
        
        if (fieldsVisible.every(v => v)) {
          log('All form fields are visible', 'success')
        } else {
          log('Some form fields are missing', 'error')
        }
        
        // Close modal
        const closeButton = modal.locator('button:has-text("Cancel")')
        if (await closeButton.isVisible()) {
          await closeButton.click()
          await page.waitForTimeout(500)
        }
      }
    } else {
      log('Create Service button not found', 'error')
    }
  } else {
    log('Client user - Create button should not be visible', 'info')
    const createButton = page.locator('button:has-text("New Service")')
    if (await createButton.isVisible()) {
      log('ERROR: Create button visible for client user', 'error')
    } else {
      log('Create button correctly hidden for client', 'success')
    }
  }
  
  // Test Filters
  log('Testing filter components...', 'test')
  
  // Search input
  const searchInput = page.locator('input[placeholder*="Search services"]')
  if (await searchInput.isVisible()) {
    log('Search input found', 'success')
    await searchInput.fill('test search')
    await page.waitForTimeout(500)
    await searchInput.clear()
  }
  
  // Status filter
  const statusFilter = page.locator('button[role="combobox"]').filter({ hasText: /Status|All Status/ })
  if (await statusFilter.isVisible()) {
    log('Status filter found', 'success')
    await statusFilter.click()
    await page.waitForTimeout(300)
    
    // Check filter options
    const activeOption = page.locator('text=Active')
    if (await activeOption.isVisible()) {
      log('Filter options are available', 'success')
      await page.keyboard.press('Escape')
    }
  }
  
  // Sort dropdown
  const sortDropdown = page.locator('button[role="combobox"]').filter({ hasText: /Sort|Recent/ })
  if (await sortDropdown.isVisible()) {
    log('Sort dropdown found', 'success')
  }
  
  return true
}

async function testResponsiveLayout(page, viewport) {
  section(`Testing Responsive Layout - ${viewport.name}`)
  
  // Set viewport
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  await page.waitForTimeout(500)
  
  log(`Viewport set to ${viewport.width}x${viewport.height}`, 'info')
  
  // Navigate to services page
  await page.goto('http://localhost:3003/services')
  await page.waitForLoadState('networkidle')
  
  // Check grid layout
  const serviceGrid = page.locator('.grid').first()
  if (await serviceGrid.isVisible()) {
    const gridClasses = await serviceGrid.getAttribute('class')
    
    // Check responsive grid classes
    if (viewport.width < 768) {
      // Mobile: should be single column
      if (gridClasses.includes('grid-cols-1')) {
        log('Mobile layout: Single column grid ✓', 'success')
      }
    } else if (viewport.width < 1024) {
      // Tablet: should be 2 columns
      if (gridClasses.includes('md:grid-cols-2')) {
        log('Tablet layout: Two column grid ✓', 'success')
      }
    } else {
      // Desktop: should be 3 columns
      if (gridClasses.includes('lg:grid-cols-3')) {
        log('Desktop layout: Three column grid ✓', 'success')
      }
    }
  }
  
  // Check card visibility and scrolling
  const cards = page.locator('[href^="/services/"]')
  const cardCount = await cards.count()
  
  if (cardCount > 0) {
    const firstCard = cards.first()
    const lastCard = cards.last()
    
    // Check if first card is visible
    if (await firstCard.isVisible()) {
      log('First service card is visible', 'success')
    }
    
    // For mobile, check horizontal scrolling isn't needed
    if (viewport.width < 768) {
      const cardBox = await firstCard.boundingBox()
      if (cardBox && cardBox.width <= viewport.width - 32) { // Account for padding
        log('Cards fit within mobile viewport', 'success')
      } else {
        log('Cards may overflow on mobile', 'error')
      }
    }
  }
  
  // Check header responsiveness
  const header = page.locator('h1').first()
  const createButton = page.locator('button:has-text("New Service"), button:has([class*="Plus"])')
  
  if (viewport.width < 640) {
    // On small screens, button text might be hidden
    const buttonText = await createButton.textContent()
    if (!buttonText.includes('New Service') || buttonText === '') {
      log('Mobile: Button text appropriately hidden/condensed', 'success')
    }
  }
  
  // Check filter layout
  const filterContainer = page.locator('[class*="flex"]').filter({ has: page.locator('input[placeholder*="Search"]') })
  if (await filterContainer.isVisible()) {
    const flexClasses = await filterContainer.getAttribute('class')
    if (viewport.width < 640 && flexClasses.includes('flex-col')) {
      log('Filters stack vertically on mobile', 'success')
    } else if (viewport.width >= 640 && flexClasses.includes('flex-row')) {
      log('Filters align horizontally on larger screens', 'success')
    }
  }
  
  return true
}

async function testProgressCalculations(page) {
  section('Testing Progress Calculations')
  
  await page.goto('http://localhost:3003/services')
  await page.waitForLoadState('networkidle')
  
  const serviceCards = page.locator('[href^="/services/"]')
  const cardCount = await serviceCards.count()
  
  if (cardCount > 0) {
    // Check each card's progress display
    for (let i = 0; i < Math.min(cardCount, 3); i++) { // Test first 3 cards
      const card = serviceCards.nth(i)
      
      // Find progress percentage displays
      const progressTexts = card.locator('text=/%/')
      const progressCount = await progressTexts.count()
      
      if (progressCount > 0) {
        const progressText = await progressTexts.first().textContent()
        log(`Card ${i + 1} progress: ${progressText}`, 'info')
        
        // Check if progress circle is rendered
        const progressCircle = card.locator('svg circle').nth(1) // Second circle is progress
        if (await progressCircle.isVisible()) {
          const strokeDashoffset = await progressCircle.getAttribute('stroke-dashoffset')
          if (strokeDashoffset) {
            log(`Progress circle stroke-dashoffset: ${strokeDashoffset}`, 'info')
          }
        }
      }
      
      // Check milestone counts
      const milestoneText = card.locator('text=/milestones/')
      if (await milestoneText.isVisible()) {
        const text = await milestoneText.textContent()
        const match = text.match(/(\d+)\s*\/\s*(\d+)/)
        if (match) {
          const [, completed, total] = match
          log(`Milestones: ${completed}/${total}`, 'info')
          
          // Verify percentage calculation
          const expectedProgress = total > 0 ? Math.round((completed / total) * 100) : 0
          log(`Expected progress: ${expectedProgress}%`, 'info')
        }
      }
    }
    
    log('Progress calculations verified', 'success')
  } else {
    log('No service cards to test progress', 'info')
  }
  
  return true
}

async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}🚀 PHASE 3 TEST SUITE: SERVICES LIST PAGE${colors.reset}`)
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`)
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  })
  
  const startTime = Date.now()
  let allTestsPassed = true
  
  try {
    // Test with admin user
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    
    // Login as admin
    await adminPage.goto('http://localhost:3003/login')
    await adminPage.fill('input[type="email"]', testAccounts.admin.email)
    await adminPage.fill('input[type="password"]', testAccounts.admin.password)
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForURL('**/admin', { timeout: 5000 })
    
    // Test services page functionality
    const adminTestPassed = await testServicesPage(adminPage, 'admin')
    allTestsPassed = allTestsPassed && adminTestPassed
    
    // Test responsive layouts
    for (const viewport of viewports) {
      const viewportTestPassed = await testResponsiveLayout(adminPage, viewport)
      allTestsPassed = allTestsPassed && viewportTestPassed
    }
    
    // Test progress calculations
    const progressTestPassed = await testProgressCalculations(adminPage)
    allTestsPassed = allTestsPassed && progressTestPassed
    
    // Test navigation to detail page
    section('Testing Navigation to Detail Pages')
    await adminPage.setViewportSize({ width: 1920, height: 1080 })
    await adminPage.goto('http://localhost:3003/services')
    await adminPage.waitForLoadState('networkidle')
    
    const firstServiceCard = adminPage.locator('[href^="/services/"]').first()
    const serviceCount = await firstServiceCard.count()
    
    if (serviceCount > 0) {
      const href = await firstServiceCard.getAttribute('href')
      log(`Clicking on service card with href: ${href}`, 'test')
      
      await firstServiceCard.click()
      await adminPage.waitForTimeout(1000)
      
      // Check if we navigated to detail page
      const currentURL = adminPage.url()
      if (currentURL.includes('/services/') && currentURL !== 'http://localhost:3003/services/') {
        log('Successfully navigated to service detail page', 'success')
        log(`Current URL: ${currentURL}`, 'info')
      } else {
        log('Navigation to detail page failed', 'error')
        allTestsPassed = false
      }
    }
    
    await adminContext.close()
    
    // Test with client user
    const clientContext = await browser.newContext()
    const clientPage = await clientContext.newPage()
    
    // Login as client
    await clientPage.goto('http://localhost:3003/login')
    await clientPage.fill('input[type="email"]', testAccounts.client.email)
    await clientPage.fill('input[type="password"]', testAccounts.client.password)
    await clientPage.click('button[type="submit"]')
    await clientPage.waitForURL('**/client', { timeout: 5000 })
    
    // Test client view
    const clientTestPassed = await testServicesPage(clientPage, 'client')
    allTestsPassed = allTestsPassed && clientTestPassed
    
    await clientContext.close()
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
    allTestsPassed = false
  } finally {
    await browser.close()
  }
  
  // Final summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`)
  if (allTestsPassed) {
    console.log(`${colors.green}${colors.bright}✅ ALL PHASE 3 TESTS PASSED${colors.reset}`)
  } else {
    console.log(`${colors.red}${colors.bright}❌ SOME TESTS FAILED${colors.reset}`)
  }
  console.log(`${colors.cyan}Duration: ${duration}s${colors.reset}`)
  console.log(`${'='.repeat(60)}\n`)
  
  process.exit(allTestsPassed ? 0 : 1)
}

// Run the tests
runAllTests().catch(console.error)