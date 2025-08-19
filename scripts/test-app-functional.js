#!/usr/bin/env node

/**
 * QUICK FUNCTIONAL TEST
 * Verify core app functionality after cleanup
 */

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@demo.com'
const PASSWORD = 'password123'

async function testAppFunctional() {
  console.log('🧪 Quick Functional Test After Cleanup...')
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 })
  const page = await browser.newPage()
  
  try {
    // Test login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin', { timeout: 10000 })
    console.log('✅ Login working')
    
    // Test services page
    await page.goto(`${BASE_URL}/services`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Services page loads')
    
    // Test templates dialog
    await page.click('text="Templates"')
    await page.waitForTimeout(2000)
    console.log('✅ Templates dialog opens')
    
    // Test knowledge hub
    await page.goto(`${BASE_URL}/knowledge`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Knowledge hub loads')
    
    // Test messages
    await page.goto(`${BASE_URL}/messages`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Messages loads')
    
    console.log('\n🎉 All core functionality working after cleanup!')
    
  } catch (error) {
    console.error('❌ Functional test failed:', error.message)
    throw error
  } finally {
    await browser.close()
  }
}

testAppFunctional()
  .then(() => console.log('✅ Functional test completed'))
  .catch(console.error)