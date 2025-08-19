#!/usr/bin/env node

/**
 * QUICK KNOWLEDGE HUB TEST
 * Test knowledge hub functionality and resource counts
 */

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@demo.com'
const PASSWORD = 'password123'

async function testKnowledgeHub() {
  console.log('🧪 Testing Knowledge Hub...')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  })
  
  const page = await browser.newPage()
  
  try {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin', { timeout: 10000 })
    console.log('✅ Admin authenticated')
    
    // Navigate to knowledge hub
    await page.goto(`${BASE_URL}/knowledge`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Knowledge hub loaded')
    
    // Take screenshot to see current state
    await page.screenshot({ path: `knowledge-hub-current-${Date.now()}.png` })
    
    // Count collections
    const collectionCards = await page.locator('.card, [data-collection]').count()
    console.log(`📊 Collection cards visible: ${collectionCards}`)
    
    // Check for resource counts in badges
    const resourceBadges = await page.locator('text=/\\d+ resources?/').count()
    console.log(`📊 Resource count badges: ${resourceBadges}`)
    
    // Get page header count
    const headerText = await page.locator('h1, .page-header').textContent()
    console.log(`📋 Page header: ${headerText}`)
    
    if (collectionCards > 0) {
      console.log('✅ Collections are displaying')
      
      // Click on first collection to test detail view
      await page.click('.card:first-child, [data-collection]:first-child')
      await page.waitForLoadState('networkidle')
      
      // Check if we navigate to collection detail
      const currentUrl = page.url()
      if (currentUrl.includes('/knowledge/')) {
        console.log('✅ Collection detail navigation working')
        
        // Take screenshot of detail view
        await page.screenshot({ path: `knowledge-detail-${Date.now()}.png` })
        
        // Check resource list
        const resources = await page.locator('.resource-item, [data-resource]').count()
        console.log(`📊 Resources in collection: ${resources}`)
      }
    } else {
      console.log('⚠️ No collections found - may need to seed data')
    }
    
  } catch (error) {
    console.error('❌ Knowledge hub test failed:', error.message)
    await page.screenshot({ path: `knowledge-error-${Date.now()}.png` })
  } finally {
    await browser.close()
  }
}

testKnowledgeHub()
  .then(() => console.log('✅ Knowledge hub test completed'))
  .catch(console.error)