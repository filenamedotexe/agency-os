#!/usr/bin/env node

/**
 * Debug Client Page and FloatingChat
 * Check console logs and component behavior
 */

const { chromium } = require('playwright');

console.log('🔍 Client Page Debug Test');
console.log('==========================\n');

const TEST_URL = 'http://localhost:3000';
const CLIENT_USER = { email: 'sarah@acmecorp.com', password: 'password123' };

async function debugClientPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    console.log(`📱 Console: ${msg.type()} - ${msg.text()}`);
  });
  
  // Capture errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('🔐 Step 1: Login as client');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('[name="email"]', CLIENT_USER.email);
    await page.fill('[name="password"]', CLIENT_USER.password);
    await page.click('button[type="submit"]');
    
    console.log('⏳ Waiting for redirect...');
    await page.waitForTimeout(5000); // Wait longer for redirect
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/client')) {
      console.log('✅ Successfully on client page');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('⚠️ Redirected to dashboard, going to client page');
      await page.goto(`${TEST_URL}/client`);
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ Unexpected redirect');
    }
    
    console.log('\n🔍 Step 2: Check FloatingChat debug logs');
    
    // Wait for component to mount and check console logs
    await page.waitForTimeout(3000);
    
    console.log('\n📄 Recent console messages:');
    consoleMessages.slice(-20).forEach(msg => console.log(`  ${msg}`));
    
    console.log('\n🔍 Step 3: Check DOM elements');
    
    // Check for loading indicator
    const loadingElements = await page.locator('div[class*="animate-pulse"]').count();
    console.log(`⏳ Loading elements: ${loadingElements}`);
    
    // Check for FloatingChat button
    const chatButtons = await page.locator('[data-testid="floating-chat-button"]').count();
    console.log(`💬 Chat buttons: ${chatButtons}`);
    
    // Check for any fixed positioned elements (potential chat)
    const fixedElements = await page.locator('[class*="fixed"]').count();
    console.log(`📌 Fixed positioned elements: ${fixedElements}`);
    
    console.log('\n🔍 Step 4: Check user profile data');
    
    // Check if user profile data is properly set
    const profile = await page.evaluate(() => {
      return {
        hasUser: typeof window !== 'undefined',
        userAgent: navigator.userAgent,
        url: window.location.href
      };
    });
    console.log('👤 Browser info:', profile);
    
    console.log('\n🔍 Step 5: Wait and check again');
    
    // Wait longer and check again
    await page.waitForTimeout(5000);
    
    const finalChatButtons = await page.locator('[data-testid="floating-chat-button"]').count();
    const finalLoadingElements = await page.locator('div[class*="animate-pulse"]').count();
    
    console.log(`💬 Final chat buttons: ${finalChatButtons}`);
    console.log(`⏳ Final loading elements: ${finalLoadingElements}`);
    
    // Try to take a screenshot
    await page.screenshot({ path: '/Users/zachwieder/Documents/CODING MAIN/final-agency/debug-client-page.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-client-page.png');
    
    console.log('\n📊 Summary:');
    console.log(`- Console messages: ${consoleMessages.length}`);
    console.log(`- Current URL: ${page.url()}`);
    console.log(`- FloatingChat rendered: ${finalChatButtons > 0 ? 'YES' : 'NO'}`);
    console.log(`- Still loading: ${finalLoadingElements > 0 ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
  
  console.log('\n⏳ Browser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
}

debugClientPage().catch(console.error);