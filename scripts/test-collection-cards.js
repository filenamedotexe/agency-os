#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

console.log('🔍 TESTING COLLECTION CARDS VISIBILITY');
console.log('======================================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_USER = { email: 'admin@demo.com', password: 'password123' };

const screenshotsDir = path.join(process.cwd(), 'collection-debug-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function takeScreenshot(page, name, description) {
  const filename = `${Date.now()}-${name}.png`;
  const filepath = path.join(screenshotsDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 ${filename} - ${description}`);
}

async function testCollectionCards() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login
    console.log('🔑 Login as admin...');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('[name="email"]', ADMIN_USER.email);
    await page.fill('[name="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Go to Knowledge Hub
    console.log('📚 Navigate to Knowledge Hub...');
    await page.goto(`${TEST_URL}/knowledge`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait
    await takeScreenshot(page, 'knowledge-hub-loaded', 'Knowledge Hub after load');
    
    // Check various selectors for collections
    console.log('🔍 Testing different collection selectors...');
    
    // Try different ways to find collection cards
    const selectors = [
      'text=Manual Test Collection',
      '[data-testid="collection-card"]',
      '.group', // Common card class
      'div:has-text("Manual Test Collection")',
      'button:has-text("Manual Test Collection")',
      'a:has-text("Manual Test Collection")',
      'h3:has-text("Manual Test Collection")',
      '*:has-text("Manual Test Collection")'
    ];
    
    for (const selector of selectors) {
      try {
        const elements = await page.locator(selector).all();
        const count = elements.length;
        const visible = count > 0 ? await elements[0].isVisible() : false;
        console.log(`✅ Selector "${selector}": found ${count} elements, first visible: ${visible}`);
        
        if (count > 0 && visible) {
          console.log(`🎯 Found working selector: ${selector}`);
          // Try to click it
          try {
            await elements[0].click();
            await page.waitForLoadState('networkidle');
            await takeScreenshot(page, 'collection-clicked', 'After clicking collection');
            
            const currentUrl = page.url();
            console.log(`✅ Successfully navigated to: ${currentUrl}`);
            
            // Check if we're on a collection detail page
            if (currentUrl.includes('/knowledge/')) {
              console.log('🎉 COLLECTION NAVIGATION SUCCESSFUL!');
              
              // Try to add a resource to test the upload functionality
              console.log('📄 Testing resource upload...');
              const addResourceButton = page.locator('text=Add Resource');
              const addResourceVisible = await addResourceButton.isVisible();
              console.log(`✅ Add Resource button visible: ${addResourceVisible}`);
              
              if (addResourceVisible) {
                await addResourceButton.click();
                await page.waitForSelector('[role="dialog"]');
                await takeScreenshot(page, 'add-resource-dialog', 'Add resource dialog opened');
                
                // Test link resource
                await page.click('button:has-text("Add Link")');
                await page.fill('input[placeholder="https://example.com/resource"]', 'https://test-final.com');
                await page.fill('input[placeholder="Resource title"]', 'Final Test Resource');
                await takeScreenshot(page, 'resource-form-filled', 'Resource form filled');
                
                // Try to submit
                const addButtons = await page.locator('button:has-text("Add Resource")').all();
                if (addButtons.length > 1) {
                  await addButtons[addButtons.length - 1].click();
                  await page.waitForLoadState('networkidle');
                  await takeScreenshot(page, 'resource-added', 'After resource addition');
                  
                  const resourceAdded = await page.locator('text=Final Test Resource').isVisible();
                  console.log(`✅ Resource added successfully: ${resourceAdded}`);
                  
                  if (resourceAdded) {
                    console.log('🎉 FULL KNOWLEDGE HUB FUNCTIONALITY CONFIRMED!');
                    return true;
                  }
                }
              }
            }
            break;
          } catch (clickError) {
            console.log(`❌ Click failed for selector "${selector}": ${clickError.message}`);
          }
        }
      } catch (selectorError) {
        console.log(`❌ Selector "${selector}" failed: ${selectorError.message}`);
      }
    }
    
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
    return false;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await takeScreenshot(page, 'error', 'Error state');
    return false;
  } finally {
    await browser.close();
  }
}

testCollectionCards()
  .then(success => {
    console.log(success ? '\n🎉 KNOWLEDGE HUB FULLY WORKING!' : '\n❌ Issues found but collections exist');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });