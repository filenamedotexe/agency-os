#!/usr/bin/env node

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3000'
const CLIENT_EMAIL = 'sarah@acmecorp.com'
const PASSWORD = 'password123'

async function testClientAuth() {
  console.log('🧪 Testing Simple Client Auth...')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  })
  
  const page = await browser.newPage()
  
  try {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Login page loaded')
    
    await page.fill('input[name="email"]', CLIENT_EMAIL)
    console.log('✅ Email filled')
    
    await page.fill('input[name="password"]', PASSWORD)
    console.log('✅ Password filled')
    
    await page.click('button[type="submit"]')
    console.log('✅ Submit clicked')
    
    // Wait and see what happens
    await page.waitForTimeout(5000)
    
    const currentUrl = page.url()
    console.log(`📍 Current URL after login: ${currentUrl}`)
    
    // Take screenshot to see what's happening
    await page.screenshot({ path: `client-auth-result-${Date.now()}.png` })
    
    if (currentUrl.includes('/client')) {
      console.log('✅ Client successfully logged in and redirected')
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Client login failed - still on login page')
      
      // Check for error messages
      const errorMessages = await page.locator('.error, .text-red-500, .text-destructive').allTextContents()
      console.log('🚨 Error messages:', errorMessages)
    } else {
      console.log(`⚠️ Client login redirected to unexpected page: ${currentUrl}`)
    }
    
  } catch (error) {
    console.error('❌ Client auth test failed:', error.message)
    await page.screenshot({ path: `client-auth-error-${Date.now()}.png` })
  } finally {
    await browser.close()
  }
}

testClientAuth()
  .then(() => console.log('✅ Client auth test completed'))
  .catch(console.error)