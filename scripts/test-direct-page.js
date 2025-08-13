#!/usr/bin/env node

const { chromium } = require('playwright');

console.log('🔍 TESTING DIRECT PAGE ACCESS');
console.log('==============================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_USER = { email: 'admin@demo.com', password: 'password123' };

async function testDirectPageAccess() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login first
    console.log('🔑 Login as admin...');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('[name="email"]', ADMIN_USER.email);
    await page.fill('[name="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Go directly to knowledge URL
    console.log('📚 Navigate directly to /knowledge...');
    await page.goto(`${TEST_URL}/knowledge`);
    await page.waitForLoadState('networkidle');
    
    // Check page content
    const pageText = await page.textContent('body');
    console.log('🔍 Page contains "Knowledge Hub":', pageText.includes('Knowledge Hub'));
    console.log('🔍 Page contains "collections available":', pageText.includes('collections available'));
    console.log('🔍 Page contains "Create Collection":', pageText.includes('Create Collection'));
    console.log('🔍 Page contains "Manual Test Collection":', pageText.includes('Manual Test Collection'));
    console.log('🔍 Page contains admin subtitle:', pageText.includes('Manage and share resources'));
    
    // Check for error messages
    console.log('🔍 Page contains errors:', pageText.includes('Failed to load') || pageText.includes('error'));
    
    // Look for collection count
    const countMatch = pageText.match(/(\d+) collections available/);
    const collectionCount = countMatch ? parseInt(countMatch[1]) : 0;
    console.log(`📊 Collections count displayed: ${collectionCount}`);
    
    // Wait for manual inspection
    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
    return collectionCount > 0;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testDirectPageAccess()
  .then(success => {
    console.log(success ? '\n🎉 Collections found!' : '\n❌ No collections displayed');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });