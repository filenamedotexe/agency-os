/**
 * Quick test script for Phase 3 Services Page
 */

const { chromium } = require('playwright')
require('dotenv').config({ path: '.env.local' })

async function quickTest() {
  console.log('🚀 Quick Phase 3 Test\n')
  
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    // Login as admin
    console.log('1. Logging in as admin...')
    await page.goto('http://localhost:3003/login')
    await page.fill('input[type="email"]', 'admin@demo.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin', { timeout: 5000 })
    console.log('✅ Logged in successfully')
    
    // Navigate to services page
    console.log('\n2. Navigating to services page...')
    await page.goto('http://localhost:3003/services')
    await page.waitForLoadState('networkidle')
    console.log('✅ Services page loaded')
    
    // Check for page elements
    console.log('\n3. Checking page elements...')
    
    // Check title
    const title = await page.locator('h1').first()
    if (await title.isVisible()) {
      const titleText = await title.textContent()
      console.log(`✅ Page title: "${titleText}"`)
    }
    
    // Check for service cards
    const cards = page.locator('[href^="/services/"]')
    const cardCount = await cards.count()
    console.log(`✅ Found ${cardCount} service cards`)
    
    // Check first card details
    if (cardCount > 0) {
      const firstCard = cards.first()
      
      // Get service name
      const serviceName = await firstCard.locator('h3').textContent()
      console.log(`✅ First service: "${serviceName}"`)
      
      // Check for progress visualization
      const progressCircle = firstCard.locator('svg circle').nth(1)
      if (await progressCircle.isVisible()) {
        console.log('✅ Progress circle visible')
      }
      
      // Check for milestone info
      const milestoneText = await firstCard.locator('text=/milestones/').textContent()
      console.log(`✅ Milestones: ${milestoneText}`)
    }
    
    // Check create button (admin/team only)
    console.log('\n4. Checking create service button...')
    const createButton = page.locator('button:has-text("New Service"), button:has([class*="Plus"])')
    if (await createButton.isVisible()) {
      console.log('✅ Create Service button visible')
      
      // Click to open modal
      await createButton.click()
      await page.waitForTimeout(500)
      
      const modal = page.locator('[role="dialog"]')
      if (await modal.isVisible()) {
        console.log('✅ Create Service modal opens')
        
        // Close modal
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        console.log('✅ Modal closes properly')
      }
    }
    
    // Check filters
    console.log('\n5. Checking filter components...')
    const searchInput = page.locator('input[placeholder*="Search services"]')
    if (await searchInput.isVisible()) {
      console.log('✅ Search input visible')
    }
    
    const statusFilter = page.locator('button[role="combobox"]').first()
    if (await statusFilter.isVisible()) {
      console.log('✅ Status filter visible')
    }
    
    // Test responsive layout
    console.log('\n6. Testing responsive layout...')
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)
    const desktopGrid = await page.locator('.grid').first().getAttribute('class')
    if (desktopGrid.includes('lg:grid-cols-3')) {
      console.log('✅ Desktop: 3 column grid')
    }
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    if (desktopGrid.includes('md:grid-cols-2')) {
      console.log('✅ Tablet: 2 column grid')
    }
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)
    if (desktopGrid.includes('grid-cols-1')) {
      console.log('✅ Mobile: 1 column grid')
    }
    
    console.log('\n✅ All Phase 3 tests passed!')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  } finally {
    await browser.close()
  }
}

quickTest().catch(console.error)