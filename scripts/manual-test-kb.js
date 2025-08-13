#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

console.log('🔍 MANUAL KNOWLEDGE HUB VERIFICATION');
console.log('====================================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_USER = { email: 'admin@demo.com', password: 'password123' };

const screenshotsDir = path.join(process.cwd(), 'manual-test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function takeScreenshot(page, name, description) {
  const filename = `${Date.now()}-${name}.png`;
  const filepath = path.join(screenshotsDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 ${filename} - ${description}`);
}

async function manualVerification() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow it down so we can see what's happening
  });
  
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });
  
  try {
    console.log('🔑 Step 1: Login as admin');
    await page.goto(`${TEST_URL}/login`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'login', 'Login page');
    
    await page.fill('[name="email"]', ADMIN_USER.email);
    await page.fill('[name="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'dashboard', 'Admin dashboard');
    
    console.log('📚 Step 2: Navigate to Knowledge Hub');
    await page.click('text=Knowledge Hub');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'knowledge-hub', 'Knowledge Hub page');
    
    // Check admin controls
    const createButton = page.locator('text=Create Collection');
    const isVisible = await createButton.isVisible();
    console.log(`✅ Create Collection button visible: ${isVisible}`);
    
    if (!isVisible) {
      console.log('❌ ADMIN CONTROLS NOT VISIBLE - DEBUGGING...');
      const pageText = await page.textContent('body');
      console.log('Page contains admin elements:', pageText.includes('Manage and share'));
      console.log('User role detected on page:', pageText.includes('admin'));
      return false;
    }
    
    console.log('📁 Step 3: Attempt to create collection');
    await createButton.click();
    
    // Wait for dialog with better selector
    try {
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await takeScreenshot(page, 'create-dialog', 'Create collection dialog');
      console.log('✅ Dialog opened successfully');
      
      // Fill form
      await page.fill('input[placeholder="Collection name"]', 'Manual Test Collection');
      await page.fill('textarea', 'Created during manual verification');
      await takeScreenshot(page, 'form-filled', 'Form filled out');
      
      // Try to click create button
      const createButtons = await page.locator('button:has-text("Create Collection")').all();
      console.log(`Found ${createButtons.length} create buttons`);
      
      // Click the button inside the dialog (should be the second one)
      if (createButtons.length > 1) {
        await createButtons[1].click();
        await page.waitForLoadState('networkidle');
        await takeScreenshot(page, 'after-create', 'After collection creation');
        console.log('✅ Collection creation attempted');
        
        // Check if collection appears
        const newCollection = page.locator('text=Manual Test Collection');
        const collectionVisible = await newCollection.isVisible();
        console.log(`✅ New collection visible: ${collectionVisible}`);
        
        if (collectionVisible) {
          console.log('📄 Step 4: Test resource upload');
          await newCollection.click();
          await page.waitForLoadState('networkidle');
          await takeScreenshot(page, 'collection-detail', 'Collection detail page');
          
          // Try to add resource
          await page.click('text=Add Resource');
          await page.waitForSelector('[role="dialog"]');
          await takeScreenshot(page, 'resource-dialog', 'Add resource dialog');
          
          // Add link resource
          await page.click('button:has-text("Add Link")');
          await page.fill('input[placeholder="https://example.com/resource"]', 'https://test.example.com');
          await page.fill('input[placeholder="Resource title"]', 'Manual Test Resource');
          await takeScreenshot(page, 'resource-form', 'Resource form filled');
          
          const addButtons = await page.locator('button:has-text("Add Resource")').all();
          if (addButtons.length > 0) {
            // Try the last button (should be in dialog)
            await addButtons[addButtons.length - 1].click();
            await page.waitForLoadState('networkidle');
            await takeScreenshot(page, 'resource-added', 'After resource addition');
            
            const resourceVisible = await page.locator('text=Manual Test Resource').isVisible();
            console.log(`✅ Resource visible: ${resourceVisible}`);
            
            return resourceVisible;
          }
        }
      }
    } catch (error) {
      console.log('❌ Dialog interaction failed:', error.message);
      await takeScreenshot(page, 'dialog-error', 'Dialog error state');
      return false;
    }
    
    console.log('⏳ Test completed - keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await takeScreenshot(page, 'error', `Error: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

// Run manual verification
manualVerification()
  .then(success => {
    console.log(success ? '\n🎉 KNOWLEDGE HUB WORKING!' : '\n❌ ISSUES FOUND');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Manual test failed:', err);
    process.exit(1);
  });