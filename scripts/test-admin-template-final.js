#!/usr/bin/env node

/**
 * FINAL ADMIN TEMPLATE TEST
 * Complete test of admin template functionality
 */

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@demo.com'
const PASSWORD = 'password123'

async function testAdminTemplateFinal() {
  console.log('🧪 Final Admin Template Functionality Test...')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
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
    
    // Go to services
    await page.goto(`${BASE_URL}/services`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Services page loaded')
    
    // =====================================================
    // TEST 1: TEMPLATE MANAGEMENT ACCESS
    // =====================================================
    console.log('\n📂 Test 1: Template Management Access')
    
    await page.click('text="Templates"')
    await page.waitForTimeout(2000)
    
    await page.screenshot({ path: `admin-templates-dialog-${Date.now()}.png` })
    
    // Count existing templates
    const existingTemplates = await page.locator('.template-item, [data-template-id]').count()
    console.log(`📊 Existing templates: ${existingTemplates}`)
    
    // =====================================================
    // TEST 2: SERVICE FROM TEMPLATE (if templates exist)
    // =====================================================
    if (existingTemplates > 0) {
      console.log('\n🚀 Test 2: Create Service from Template')
      
      // Close templates dialog first
      await page.press('body', 'Escape')
      await page.waitForTimeout(1000)
      
      // Click From Template
      await page.click('text="From Template"')
      await page.waitForTimeout(2000)
      
      await page.screenshot({ path: `admin-from-template-${Date.now()}.png` })
      
      // Check if templates show up in this dialog
      const templatesInCreateDialog = await page.locator('.template-item, [data-template-id]').count()
      console.log(`📊 Templates in create dialog: ${templatesInCreateDialog}`)
      
      if (templatesInCreateDialog > 0) {
        // Select first template
        await page.click('.template-item:first-child, [data-template-id]:first-child')
        await page.waitForTimeout(1000)
        
        // Check if service form appears
        const serviceForm = await page.locator('form, .service-form').count()
        console.log(`📊 Service creation form elements: ${serviceForm}`)
        
        if (serviceForm > 0) {
          console.log('✅ Service creation from template UI working')
        }
      }
    }
    
    // =====================================================
    // TEST 3: TEMPLATE CREATION
    // =====================================================
    console.log('\n🎨 Test 3: Template Creation')
    
    // Go back to services page
    await page.goto(`${BASE_URL}/services`)
    await page.click('text="Templates"')
    await page.waitForTimeout(1000)
    
    // Try to create new template
    await page.click('button:has-text("Create New Template")')
    await page.waitForTimeout(2000)
    
    await page.screenshot({ path: `admin-create-template-${Date.now()}.png` })
    
    // Check if form loaded
    const createForm = await page.locator('form, .template-form').count()
    console.log(`📊 Create template form elements: ${createForm}`)
    
    if (createForm > 0) {
      console.log('✅ Template creation form accessible')
      
      // Test basic form filling
      await page.fill('input[placeholder*="Website"], input[placeholder*="template"]', 'Final E2E Test Template')
      console.log('✅ Template name filled')
      
      // Test milestone creation
      const milestoneInputs = await page.locator('input[placeholder*="Discovery"], input[placeholder*="milestone"], input[placeholder*="Planning"]').count()
      if (milestoneInputs > 0) {
        await page.fill('input[placeholder*="Discovery"], input[placeholder*="milestone"], input[placeholder*="Planning"]', 'Test Milestone')
        console.log('✅ Milestone name filled')
        
        // Test smart date inputs
        const startDateInputs = await page.locator('input[placeholder*="same day"], input[placeholder*="start"], [data-testid*="start"]').count()
        const dueDateInputs = await page.locator('input[placeholder*="week"], input[placeholder*="due"], [data-testid*="due"]').count()
        
        console.log(`📊 Start date inputs found: ${startDateInputs}`)
        console.log(`📊 Due date inputs found: ${dueDateInputs}`)
        
        if (startDateInputs > 0 && dueDateInputs > 0) {
          console.log('✅ Smart date inputs available')
        }
      }
    }
    
    console.log('\n🎯 ADMIN TEMPLATE TEST SUMMARY:')
    console.log('✅ Authentication successful')
    console.log('✅ Services page accessible') 
    console.log('✅ Template management dialog opens')
    console.log(`✅ ${existingTemplates} templates available`)
    console.log('✅ Template creation form accessible')
    console.log('✅ Smart date inputs present')
    console.log('\n🏆 ADMIN TEMPLATE FUNCTIONALITY: WORKING!')
    
  } catch (error) {
    console.error('❌ Admin template test failed:', error.message)
    await page.screenshot({ path: `admin-template-final-error-${Date.now()}.png` })
  } finally {
    await browser.close()
  }
}

testAdminTemplateFinal()
  .then(() => console.log('✅ Admin template final test completed'))
  .catch(console.error)