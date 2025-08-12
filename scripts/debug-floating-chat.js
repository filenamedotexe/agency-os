#!/usr/bin/env node

/**
 * Debug Floating Chat Component
 * Verify the chat interface is rendering properly
 */

const { chromium } = require('playwright');

console.log('🔍 Floating Chat Debug Test');
console.log('============================\n');

const TEST_URL = 'http://localhost:3000';
const CLIENT_USER = { email: 'sarah@acmecorp.com', password: 'password123' };

async function debugFloatingChat() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔐 Step 1: Login as client');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('[name="email"]', CLIENT_USER.email);
    await page.fill('[name="password"]', CLIENT_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/client**', { timeout: 10000 });
    console.log('  ✅ Client logged in successfully');
    
    console.log('\n🔍 Step 2: Inspect page for floating chat elements');
    
    // Check if FloatingChat component is present
    const chatButtons = await page.locator('button').all();
    console.log(`  📊 Found ${chatButtons.length} buttons on page`);
    
    // Check specifically for floating chat button
    const floatingChatButton = await page.locator('[data-testid="floating-chat-button"]').count();
    console.log(`  📍 Floating chat buttons with testid: ${floatingChatButton}`);
    
    // Check for any button with MessageCircle icon
    const messageButtons = await page.locator('button:has(svg)').count();
    console.log(`  💬 Buttons with SVG icons: ${messageButtons}`);
    
    // Check for chat-related classes
    const chatElements = await page.locator('[class*="chat"]').count();
    console.log(`  🗨️ Elements with "chat" in class: ${chatElements}`);
    
    // Get all button text content
    const buttonTexts = [];
    for (const button of chatButtons) {
      try {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const classes = await button.getAttribute('class');
        buttonTexts.push({ text: text?.trim(), ariaLabel, classes });
      } catch (e) {
        // Skip if button is not accessible
      }
    }
    
    console.log('\n📋 All buttons found:');
    buttonTexts.forEach((btn, i) => {
      console.log(`  ${i + 1}. Text: "${btn.text}", Aria: "${btn.ariaLabel}", Classes: "${btn.classes}"`);
    });
    
    console.log('\n🔍 Step 3: Try to find and click chat button');
    
    // Try different selectors to find the chat button
    const selectors = [
      '[data-testid="floating-chat-button"]',
      'button[aria-label*="chat"]',
      'button:has-text("Chat")',
      'button:has(svg)', // Any button with an icon
      'button' // First button as fallback
    ];
    
    let chatOpened = false;
    for (const selector of selectors) {
      try {
        const elements = await page.locator(selector).count();
        console.log(`  🔍 Trying selector "${selector}": found ${elements} elements`);
        
        if (elements > 0) {
          const element = page.locator(selector).first();
          await element.click({ timeout: 3000 });
          console.log(`  ✅ Clicked element with selector: ${selector}`);
          
          // Wait for chat interface to appear
          await page.waitForTimeout(2000);
          
          // Check if textarea appeared
          const textareas = await page.locator('textarea').count();
          console.log(`  📝 Textareas after click: ${textareas}`);
          
          if (textareas > 0) {
            console.log('  🎯 SUCCESS: Chat interface opened with textarea!');
            chatOpened = true;
            break;
          }
        }
      } catch (error) {
        console.log(`  ❌ Failed with selector "${selector}": ${error.message}`);
      }
    }
    
    if (!chatOpened) {
      console.log('\n🚨 ISSUE: Could not open chat interface');
      console.log('🔍 Let\'s check the page source...');
      
      // Check if user role is properly set
      const bodyContent = await page.content();
      console.log('  📄 Checking if FloatingChat component is in DOM...');
      
      if (bodyContent.includes('floating-chat') || bodyContent.includes('FloatingChat')) {
        console.log('  ✅ FloatingChat component found in DOM');
      } else {
        console.log('  ❌ FloatingChat component NOT found in DOM');
      }
      
      // Check console errors
      console.log('\n📱 Browser console messages:');
      page.on('console', msg => {
        console.log(`  Console: ${msg.type()} - ${msg.text()}`);
      });
    }
    
    console.log('\n🔍 Step 4: Final DOM inspection');
    const finalTextareas = await page.locator('textarea').count();
    const finalButtons = await page.locator('button').count();
    const chatWindows = await page.locator('[data-testid*="chat"], [class*="chat"]').count();
    
    console.log(`  📊 Final count - Buttons: ${finalButtons}, Textareas: ${finalTextareas}, Chat elements: ${chatWindows}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
  
  console.log('\n⏳ Browser will stay open for 15 seconds for manual inspection...');
  await page.waitForTimeout(15000);
  
  await browser.close();
}

debugFloatingChat().catch(console.error);