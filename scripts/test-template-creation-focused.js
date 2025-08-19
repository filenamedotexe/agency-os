#!/usr/bin/env node

/**
 * FOCUSED TEMPLATE CREATION TEST
 * Test just the core template creation flow to verify it works
 */

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@demo.com'
const PASSWORD = 'password123'

async function testTemplateCreation() {
  console.log('🧪 Testing Template Creation Flow...')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  })
  
  const page = await browser.newPage()
  
  try {
    // Auth
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin', { timeout: 10000 })
    console.log('✅ Admin authenticated')
    
    // Navigate to services
    await page.goto(`${BASE_URL}/services`)
    await page.waitForLoadState('networkidle')
    
    // Open templates dialog
    await page.click('text="Templates"')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    console.log('✅ Templates dialog opened')
    
    // Take screenshot to see the dialog
    await page.screenshot({ path: `templates-dialog-${Date.now()}.png` })
    
    // Look for Create New Template button
    const createButton = await page.locator('button:has-text("Create New Template")').count()
    console.log(`📊 "Create New Template" button count: ${createButton}`)
    
    if (createButton > 0) {
      await page.click('button:has-text("Create New Template")')
      await page.waitForTimeout(2000)
      console.log('✅ Create template form opened')
      
      // Take screenshot of form
      await page.screenshot({ path: `template-form-${Date.now()}.png` })
      
      // Check for form fields
      const nameInput = await page.locator('input[placeholder*="Website Development"], input[placeholder*="template"]').count()
      const descInput = await page.locator('textarea[placeholder*="description"]').count()
      
      console.log(`📊 Name input fields: ${nameInput}`)
      console.log(`📊 Description fields: ${descInput}`)
      
      if (nameInput > 0) {
        // Try filling the form
        await page.fill('input[placeholder*="Website Development"], input[placeholder*="template"]', 'E2E Test Template')
        console.log('✅ Template name filled')
        
        if (descInput > 0) {
          await page.fill('textarea[placeholder*="description"]', 'Created during E2E testing')
          console.log('✅ Template description filled')
        }
        
        // Look for milestone fields
        const milestoneInputs = await page.locator('input[placeholder*="Discovery"], input[placeholder*="milestone"]').count()
        console.log(`📊 Milestone input fields: ${milestoneInputs}`)
        
        if (milestoneInputs > 0) {
          await page.fill('input[placeholder*="Discovery"], input[placeholder*="milestone"]', 'Test Milestone')
          console.log('✅ Milestone name filled')
          
          // Test smart date inputs
          const startDateInputs = await page.locator('[data-testid*="start"], input[placeholder*="start"], input[placeholder*="same day"]').count()
          const dueDateInputs = await page.locator('[data-testid*="due"], input[placeholder*="due"], input[placeholder*="week"]').count()
          
          console.log(`📊 Start date inputs: ${startDateInputs}`)
          console.log(`📊 Due date inputs: ${dueDateInputs}`)
          
          if (startDateInputs > 0 && dueDateInputs > 0) {
            // Fill smart date inputs
            await page.fill('[data-testid*="start"], input[placeholder*="start"], input[placeholder*="same day"]', '0 days')
            await page.fill('[data-testid*="due"], input[placeholder*="due"], input[placeholder*="week"]', '1 week')
            console.log('✅ Smart date inputs filled')
            
            // Try to submit
            const submitButton = await page.locator('button:has-text("Create Template"), button[type="submit"]').count()
            console.log(`📊 Submit buttons: ${submitButton}`)
            
            if (submitButton > 0) {
              await page.click('button:has-text("Create Template"), button[type="submit"]')
              await page.waitForTimeout(3000)
              
              // Check for success or error
              const successToast = await page.locator('.toast:has-text("success"), .toast:has-text("created")').count()
              const errorToast = await page.locator('.toast:has-text("error"), .toast:has-text("failed")').count()
              
              if (successToast > 0) {
                console.log('🎉 Template creation successful!')
              } else if (errorToast > 0) {
                console.log('❌ Template creation failed - error message shown')
                await page.screenshot({ path: `template-creation-error-${Date.now()}.png` })
              } else {
                console.log('⏳ No toast message detected - taking screenshot')
                await page.screenshot({ path: `template-creation-status-${Date.now()}.png` })
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Template creation test failed:', error.message)
    await page.screenshot({ path: `template-test-error-${Date.now()}.png` })
    throw error
  } finally {
    await browser.close()
  }
}

testTemplateCreation()
  .then(() => console.log('✅ Template creation test completed'))
  .catch(console.error)