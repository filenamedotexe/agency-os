#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(ctx => ctx.newPage());
  
  console.log('Testing email management server actions...');
  
  try {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to email settings
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForTimeout(2000);
    
    // Click Templates tab
    const templatesTab = await page.locator('button:has-text("Templates")').first();
    await templatesTab.click();
    await page.waitForTimeout(2000);
    
    // Test toggle
    const firstSwitch = await page.locator('button[role="switch"]').first();
    const initialState = await firstSwitch.getAttribute('data-state');
    console.log('Initial toggle state:', initialState);
    
    await firstSwitch.click();
    await page.waitForTimeout(2000);
    
    const newState = await firstSwitch.getAttribute('data-state');
    console.log('New toggle state:', newState);
    
    if (initialState !== newState) {
      console.log('✅ Toggle test PASSED - Server actions working');
    } else {
      console.log('❌ Toggle test FAILED - Server actions not working');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  await browser.close();
})();