#!/usr/bin/env node

/**
 * SIMPLE AUTH TEST - Just test login flow
 */

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@demo.com'
const PASSWORD = 'password123'

async function testAuth() {
  console.log('🧪 Testing Authentication Flow...')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  })
  
  const page = await browser.newPage()
  
  try {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Login page loaded')
    
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/admin', { timeout: 10000 })
    console.log('✅ Admin authentication successful')
    
    // Navigate to services
    await page.goto(`${BASE_URL}/services`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Services page loaded')
    
    // Check what buttons are actually available
    const buttons = await page.locator('button').allTextContents()
    console.log('📋 Available buttons:', buttons.filter(text => text.trim().length > 0))
    
    // Look for template-related buttons
    const hasTemplates = await page.locator('text="Templates"').count()
    console.log(`📊 "Templates" button count: ${hasTemplates}`)
    
    if (hasTemplates > 0) {
      await page.click('text="Templates"')
      await page.waitForTimeout(2000)
      console.log('✅ Templates dialog opened')
      
      // Check what's in the dialog
      const dialogContent = await page.locator('[role="dialog"]').textContent()
      console.log('📄 Dialog content preview:', dialogContent.substring(0, 200) + '...')
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message)
    await page.screenshot({ path: `auth-test-error-${Date.now()}.png` })
    throw error
  } finally {
    await browser.close()
  }
}

testAuth()
  .then(() => console.log('✅ Auth test completed'))
  .catch(console.error)