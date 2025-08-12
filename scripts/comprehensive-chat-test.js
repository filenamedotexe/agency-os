#!/usr/bin/env node

/**
 * Comprehensive Chat Test
 * Test all aspects of chat functionality with detailed debugging
 */

const { chromium } = require('playwright');

console.log('💬 Comprehensive Chat Test');
console.log('===========================\n');

const TEST_URL = 'http://localhost:3000';
const CLIENT_USER = { email: 'sarah@acmecorp.com', password: 'password123' };
const ADMIN_USER = { email: 'admin@demo.com', password: 'password123' };

async function comprehensiveChatTest() {
  const browser = await chromium.launch({ headless: false });
  
  try {
    // Create two contexts for client and admin
    const clientContext = await browser.newContext();
    const adminContext = await browser.newContext();
    
    const clientPage = await clientContext.newPage();
    const adminPage = await adminContext.newPage();
    
    // Capture console messages
    const clientLogs = [];
    const adminLogs = [];
    
    clientPage.on('console', msg => {
      clientLogs.push(`CLIENT: ${msg.type()} - ${msg.text()}`);
      console.log(`👤 CLIENT: ${msg.type()} - ${msg.text()}`);
    });
    
    adminPage.on('console', msg => {
      adminLogs.push(`ADMIN: ${msg.type()} - ${msg.text()}`);
      console.log(`👨‍💼 ADMIN: ${msg.type()} - ${msg.text()}`);
    });
    
    console.log('🔐 Step 1: Login both users');
    
    // Login client
    await clientPage.goto(`${TEST_URL}/login`);
    await clientPage.fill('[name="email"]', CLIENT_USER.email);
    await clientPage.fill('[name="password"]', CLIENT_USER.password);
    await clientPage.click('button[type="submit"]');
    await clientPage.waitForURL('**/client**', { timeout: 10000 });
    console.log('  ✅ Client logged in');
    
    // Login admin  
    await adminPage.goto(`${TEST_URL}/login`);
    await adminPage.fill('[name="email"]', ADMIN_USER.email);
    await adminPage.fill('[name="password"]', ADMIN_USER.password);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/admin**', { timeout: 10000 });
    console.log('  ✅ Admin logged in');
    
    console.log('\\n💬 Step 2: Open chat interfaces');
    
    // Wait for FloatingChat to load and open it
    await clientPage.waitForSelector('[data-testid="floating-chat-button"]', { timeout: 15000 });
    console.log('  📍 FloatingChat button found');
    
    await clientPage.click('[data-testid="floating-chat-button"]');
    await clientPage.waitForTimeout(3000);
    console.log('  ✅ Client chat opened');
    
    // Navigate admin to messages page
    await adminPage.goto(`${TEST_URL}/messages`);
    await adminPage.waitForTimeout(3000);
    console.log('  ✅ Admin on messages page');
    
    console.log('\\n📝 Step 3: Test client message sending');
    
    // Verify textarea is present in client chat
    const clientTextarea = await clientPage.locator('textarea').count();
    console.log(`  📝 Client textareas found: ${clientTextarea}`);
    
    if (clientTextarea > 0) {
      const clientMessage = `Test message from client - ${Date.now()}`;
      console.log(`  📤 Sending client message: "${clientMessage}"`);
      
      await clientPage.fill('textarea', clientMessage);
      
      // Check if send button is enabled
      const sendButton = clientPage.locator('button[aria-label="Send message"]');
      const isEnabled = await sendButton.isEnabled();
      console.log(`  🔘 Send button enabled: ${isEnabled}`);
      
      const beforeSend = Date.now();
      await sendButton.click();
      console.log(`  📤 Send button clicked at ${beforeSend}`);
      
      // Wait and check if message appears in client chat
      await clientPage.waitForTimeout(2000);
      
      try {
        await clientPage.waitForText(clientMessage, { timeout: 3000 });
        const afterAppear = Date.now();
        const delay = afterAppear - beforeSend;
        console.log(`  ✅ Client message appeared after ${delay}ms`);
      } catch (error) {
        console.log(`  ❌ Client message did not appear: ${error.message}`);
        
        // Debug: Check all text content
        const allText = await clientPage.textContent('body');
        if (allText.includes(clientMessage)) {
          console.log('  🔍 Message found in page text but not in expected location');
        } else {
          console.log('  🔍 Message not found anywhere on page');
        }
      }
    } else {
      console.log('  ❌ No textarea found in client chat');
    }
    
    console.log('\\n📝 Step 4: Test admin message interface');
    
    // Try to click on client conversation in admin
    try {
      await adminPage.waitForSelector('text=Sarah Johnson', { timeout: 5000 });
      await adminPage.click('text=Sarah Johnson');
      await adminPage.waitForTimeout(2000);
      console.log('  ✅ Admin opened client conversation');
      
      const adminTextarea = await adminPage.locator('textarea').count();
      console.log(`  📝 Admin textareas found: ${adminTextarea}`);
      
      if (adminTextarea > 0) {
        const adminMessage = `Test reply from admin - ${Date.now()}`;
        console.log(`  📤 Sending admin message: "${adminMessage}"`);
        
        await adminPage.fill('textarea', adminMessage);
        const beforeSendAdmin = Date.now();
        await adminPage.click('button[aria-label="Send message"]');
        console.log(`  📤 Admin send button clicked at ${beforeSendAdmin}`);
        
        // Check if admin message appears in admin chat
        try {
          await adminPage.waitForText(adminMessage, { timeout: 3000 });
          const afterAppearAdmin = Date.now();
          const delayAdmin = afterAppearAdmin - beforeSendAdmin;
          console.log(`  ✅ Admin message appeared after ${delayAdmin}ms`);
        } catch (error) {
          console.log(`  ❌ Admin message did not appear: ${error.message}`);
        }
        
        console.log('\\n📱 Step 5: Test cross-user real-time updates');
        
        // Check if admin message appears in client chat
        try {
          await clientPage.waitForText(adminMessage, { timeout: 5000 });
          console.log('  ✅ Admin message appeared in client chat via real-time');
        } catch (error) {
          console.log(`  ❌ Admin message did not appear in client chat: ${error.message}`);
        }
        
      } else {
        console.log('  ❌ No textarea found in admin chat');
      }
      
    } catch (error) {
      console.log(`  ❌ Could not find or open client conversation: ${error.message}`);
    }
    
    console.log('\\n🔍 Step 6: Debug analysis');
    
    // Take screenshots for debugging
    await clientPage.screenshot({ path: '/Users/zachwieder/Documents/CODING MAIN/final-agency/debug-client-chat.png', fullPage: true });
    await adminPage.screenshot({ path: '/Users/zachwieder/Documents/CODING MAIN/final-agency/debug-admin-chat.png', fullPage: true });
    console.log('  📸 Screenshots saved');
    
    // Check recent console logs
    console.log('\\n📱 Recent client console logs:');
    clientLogs.slice(-10).forEach(log => console.log(`    ${log}`));
    
    console.log('\\n📱 Recent admin console logs:');
    adminLogs.slice(-10).forEach(log => console.log(`    ${log}`));
    
    console.log('\\n✅ COMPREHENSIVE TEST RESULTS');
    console.log('=====================================');
    console.log(`- FloatingChat renders: ${clientTextarea > 0 ? 'YES' : 'NO'}`);
    console.log(`- Admin chat interface: ${await adminPage.locator('textarea').count() > 0 ? 'YES' : 'NO'}`);
    console.log(`- Client logs collected: ${clientLogs.length}`);
    console.log(`- Admin logs collected: ${adminLogs.length}`);
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
  }
  
  console.log('\\n⏳ Browser will stay open for 20 seconds for inspection...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  await browser.close();
}

comprehensiveChatTest().catch(console.error);