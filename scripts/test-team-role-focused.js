#!/usr/bin/env node

/**
 * FOCUSED TEAM ROLE TEST
 * Test team member template access
 */

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3000'
const TEAM_EMAIL = 'team@demo.com'
const PASSWORD = 'password123'

async function testTeamRole() {
  console.log('🧪 Testing Team Member Template Access...')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  })
  
  const page = await browser.newPage()
  
  try {
    // Auth
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[name="email"]', TEAM_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/team', { timeout: 10000 })
    console.log('✅ Team member authenticated')
    
    // Navigate to services
    await page.goto(`${BASE_URL}/services`)
    await page.waitForLoadState('networkidle')
    
    // Check if Templates button exists for team members
    const templatesButton = await page.locator('text="Templates"').count()
    console.log(`📊 "Templates" button for team member: ${templatesButton}`)
    
    if (templatesButton > 0) {
      await page.click('text="Templates"')
      await page.waitForTimeout(2000)
      console.log('✅ Team member can access templates')
      
      await page.screenshot({ path: `team-templates-dialog-${Date.now()}.png` })
      
      // Check template count in dialog
      const templates = await page.locator('.template-item, [data-template]').count()
      console.log(`📊 Templates visible to team member: ${templates}`)
    }
    
    // Test "From Template" button
    const fromTemplateButton = await page.locator('text="From Template"').count()
    console.log(`📊 "From Template" button for team member: ${fromTemplateButton}`)
    
    if (fromTemplateButton > 0) {
      await page.click('text="From Template"')
      await page.waitForTimeout(2000)
      
      await page.screenshot({ path: `team-from-template-${Date.now()}.png` })
      
      const templatesInFromDialog = await page.locator('.template-item, [data-template]').count()
      console.log(`📊 Templates in "From Template" dialog: ${templatesInFromDialog}`)
    }
    
  } catch (error) {
    console.error('❌ Team role test failed:', error.message)
    await page.screenshot({ path: `team-test-error-${Date.now()}.png` })
    throw error
  } finally {
    await browser.close()
  }
}

testTeamRole()
  .then(() => console.log('✅ Team role test completed'))
  .catch(console.error)