#!/usr/bin/env node

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3000'
const CLIENT_EMAIL = 'sarah@acmecorp.com'
const PASSWORD = 'password123'

async function testClientRestriction() {
  console.log('🧪 Testing Client Services Page Restriction...')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  })
  
  const page = await browser.newPage()
  
  try {
    // Login as client
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', CLIENT_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/client', { timeout: 10000 })
    console.log('✅ Client authenticated and on client dashboard')
    
    // Now try to access services page
    console.log('🔍 Testing services page access...')
    await page.goto(`${BASE_URL}/services`)
    
    // Wait a bit to see what happens
    await page.waitForTimeout(3000)
    
    const finalUrl = page.url()
    console.log(`📍 Final URL after trying to access /services: ${finalUrl}`)
    
    await page.screenshot({ path: `client-services-access-${Date.now()}.png` })
    
    if (finalUrl.includes('/client')) {
      console.log('🎉 SUCCESS: Client correctly redirected away from services!')
    } else if (finalUrl.includes('/services')) {
      console.log('❌ SECURITY ISSUE: Client can access services page!')
      
      // Check what's visible on the page
      const buttons = await page.locator('button').allTextContents()
      console.log('🚨 Buttons visible to client on services page:', buttons.filter(t => t.trim()))
    }
    
  } catch (error) {
    console.error('❌ Client restriction test failed:', error.message)
    await page.screenshot({ path: `client-restriction-error-${Date.now()}.png` })
  } finally {
    await browser.close()
  }
}

testClientRestriction()
  .then(() => console.log('✅ Client restriction test completed'))
  .catch(console.error)