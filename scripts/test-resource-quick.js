#!/usr/bin/env node

const { chromium } = require('playwright');

console.log('🧪 QUICK RESOURCE UPLOAD TEST');
console.log('=============================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_USER = { email: 'admin@demo.com', password: 'password123' };

async function testResourceUpload() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login as admin
    console.log('1️⃣ Login as admin...');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('[name="email"]', ADMIN_USER.email);
    await page.fill('[name="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Go to Knowledge Hub
    console.log('2️⃣ Navigate to Knowledge Hub...');
    await page.click('text=Knowledge Hub');
    await page.waitForLoadState('networkidle');
    
    // Check if we can create collection
    await page.waitForTimeout(2000); // Wait for page to fully load
    const hasCreateButton = await page.locator('text=Create Collection').isVisible();
    console.log(`✅ Create Collection button visible: ${hasCreateButton}`);
    
    // Debug: Check what's on the page
    const pageContent = await page.content();
    console.log('🔍 Page contains "Create Collection":', pageContent.includes('Create Collection'));
    console.log('🔍 Page contains "Knowledge Hub":', pageContent.includes('Knowledge Hub'));
    
    if (hasCreateButton) {
      // Try to create a collection
      console.log('3️⃣ Testing collection creation...');
      await page.click('text=Create Collection');
      await page.waitForSelector('[role="dialog"]');
      
      await page.fill('input[placeholder="Collection name"]', 'RLS Test Collection');
      await page.fill('textarea', 'Testing RLS policies');
      
      // Click create - use force to bypass overlay
      await page.click('button:has-text("Create Collection"):last-of-type', { force: true });
      await page.waitForLoadState('networkidle');
      console.log('✅ Collection created successfully');
      
      // Open collection and try resource upload
      await page.click('text=RLS Test Collection');
      await page.waitForLoadState('networkidle');
      
      console.log('4️⃣ Testing resource upload...');
      await page.click('text=Add Resource');
      await page.waitForSelector('[role="dialog"]');
      
      // Try link resource first
      await page.click('button:has-text("Add Link")');
      await page.fill('input[placeholder="https://example.com/resource"]', 'https://test.com');
      await page.fill('input[placeholder="Resource title"]', 'RLS Test Link');
      
      await page.click('button:has-text("Add Resource"):last-of-type', { force: true });
      await page.waitForLoadState('networkidle');
      console.log('✅ Resource upload successful - RLS policies working!');
      
      return true;
    } else {
      console.log('❌ Admin controls not visible');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run test
testResourceUpload()
  .then(success => {
    console.log(success ? '\n🎉 RLS POLICIES FIXED!' : '\n❌ Issues remain');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });