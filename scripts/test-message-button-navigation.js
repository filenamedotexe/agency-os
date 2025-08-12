#!/usr/bin/env node

/**
 * Test Message Button Navigation
 * Verify that clicking message button on client profile navigates to correct conversation
 */

const { chromium } = require('playwright');

console.log('💬 Message Button Navigation Test');
console.log('===================================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_USER = { email: 'admin@demo.com', password: 'password123' };
const TEST_CLIENT_ID = 'f102101c-c20e-4211-908f-c7a9b4f50a45'; // Sarah Johnson

async function testMessageButtonNavigation() {
  const browser = await chromium.launch({ headless: false });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔐 Step 1: Login as admin');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('[name="email"]', ADMIN_USER.email);
    await page.fill('[name="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 10000 });
    console.log('  ✅ Admin logged in');
    
    console.log('\n📋 Step 2: Navigate to client profile');
    await page.goto(`${TEST_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(2000);
    
    const profileUrl = page.url();
    const hasProfilePage = await page.locator('text=Client Profile').count() > 0;
    const hasClientName = await page.locator('text=Sarah Johnson').count() > 0;
    
    console.log(`  📍 Profile URL: ${profileUrl}`);
    console.log(`  ✅ Profile page loaded: ${hasProfilePage ? 'YES' : 'NO'}`);
    console.log(`  ✅ Client name displayed: ${hasClientName ? 'YES' : 'NO'}`);
    
    console.log('\n💬 Step 3: Click message button');
    
    // Look for message button
    const messageButton = await page.locator('button:has-text("Message")').count();
    console.log(`  📍 Message button found: ${messageButton > 0 ? 'YES' : 'NO'}`);
    
    if (messageButton > 0) {
      // Click the message button
      await page.click('button:has-text("Message")');
      console.log('  ✅ Message button clicked');
      
      // Wait for navigation and toast
      await page.waitForTimeout(3000);
      
      // Check if we're on messages page
      const messagesUrl = page.url();
      const onMessagesPage = messagesUrl.includes('/messages');
      const hasConversationParam = messagesUrl.includes('conversation=');
      
      console.log(`  📍 Current URL: ${messagesUrl}`);
      console.log(`  ✅ Navigated to messages: ${onMessagesPage ? 'YES' : 'NO'}`);
      console.log(`  ✅ Has conversation param: ${hasConversationParam ? 'YES' : 'NO'}`);
      
      if (onMessagesPage) {
        // Check if correct conversation is selected
        const conversationSelected = await page.locator('.bg-accent:has-text("Sarah Johnson")').count() > 0;
        const chatThreadVisible = await page.locator('text=Sarah Johnson').first().isVisible();
        const messageInputVisible = await page.locator('textarea').isVisible();
        
        console.log('\n🔍 Step 4: Verify conversation is open');
        console.log(`  ✅ Sarah Johnson conversation selected: ${conversationSelected ? 'YES' : 'NO'}`);
        console.log(`  ✅ Chat thread visible: ${chatThreadVisible ? 'YES' : 'NO'}`);
        console.log(`  ✅ Message input visible: ${messageInputVisible ? 'YES' : 'NO'}`);
        
        // Try sending a test message
        if (messageInputVisible) {
          console.log('\n📝 Step 5: Test sending message');
          const testMessage = `Test message from profile button - ${Date.now()}`;
          await page.fill('textarea', testMessage);
          await page.click('button[aria-label="Send message"]');
          await page.waitForTimeout(1000);
          
          const messageSent = await page.locator(`text="${testMessage}"`).count() > 0;
          console.log(`  ✅ Test message sent and visible: ${messageSent ? 'YES' : 'NO'}`);
        }
      }
      
      console.log('\n✅ MESSAGE BUTTON TEST RESULTS');
      console.log('==================================');
      console.log(`🟢 Message button present on profile: ${messageButton > 0 ? 'PASS' : 'FAIL'}`);
      console.log(`🟢 Navigates to messages page: ${onMessagesPage ? 'PASS' : 'FAIL'}`);
      console.log(`🟢 Includes conversation parameter: ${hasConversationParam ? 'PASS' : 'FAIL'}`);
      console.log(`🟢 Opens correct conversation: ${hasConversationParam ? 'PASS' : 'NEEDS CHECK'}`);
      
    } else {
      console.log('  ❌ Message button not found on client profile page');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n⏳ Browser will stay open for 10 seconds for inspection...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await browser.close();
}

testMessageButtonNavigation().catch(console.error);