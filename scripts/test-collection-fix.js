#!/usr/bin/env node

const { chromium } = require('playwright');

console.log('🧪 TESTING COLLECTION VISIBILITY FIX');
console.log('====================================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_USER = { email: 'admin@demo.com', password: 'password123' };

async function testCollectionFix() {
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
    
    // Navigate to Knowledge Hub
    console.log('📚 Navigate to Knowledge Hub...');
    await page.click('text=Knowledge Hub');
    await page.waitForLoadState('networkidle');
    
    // Check if Manual Test Collection now shows up
    const manualCollection = await page.locator('text=Manual Test Collection').isVisible();
    console.log(`✅ Manual Test Collection visible: ${manualCollection}`);
    
    if (manualCollection) {
      console.log('🎉 COLLECTION VISIBILITY FIX SUCCESSFUL!');
      console.log('📄 Testing resource upload...');
      
      // Open collection
      await page.click('text=Manual Test Collection');
      await page.waitForLoadState('networkidle');
      
      // Try to add resource
      await page.click('text=Add Resource');
      await page.waitForSelector('[role="dialog"]');
      
      // Add link resource
      await page.click('button:has-text("Add Link")');
      await page.fill('input[placeholder="https://example.com/resource"]', 'https://fixed.example.com');
      await page.fill('input[placeholder="Resource title"]', 'Post-Fix Test Resource');
      
      const addButtons = await page.locator('button:has-text("Add Resource")').all();
      await addButtons[addButtons.length - 1].click();
      await page.waitForLoadState('networkidle');
      
      const resourceAdded = await page.locator('text=Post-Fix Test Resource').isVisible();
      console.log(`✅ Resource added successfully: ${resourceAdded}`);
      
      return resourceAdded;
    } else {
      console.log('❌ Collection still not visible - need more investigation');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testCollectionFix()
  .then(success => {
    console.log(success ? '\n🎉 KNOWLEDGE HUB FULLY FIXED!' : '\n❌ Still issues to resolve');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });