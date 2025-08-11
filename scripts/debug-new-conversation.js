#!/usr/bin/env node

/**
 * Debug New Conversation Creation
 * Test the actual new conversation flow and capture errors
 */

const { chromium } = require('playwright');

console.log('🔍 Debugging New Conversation Creation');
console.log('=====================================');

async function debugNewConversation() {
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging to capture errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 BROWSER ERROR:', msg.text());
      } else if (msg.type() === 'log') {
        console.log('📝 BROWSER LOG:', msg.text());
      }
    });

    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP ERROR: ${response.status()} ${response.url()}`);
      }
    });

    console.log('\n1️⃣ Logging in as admin...');
    await page.goto('http://localhost:3005/login');
    await page.waitForSelector('input[type="email"]');
    
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/dashboard/);
    console.log('✅ Login successful');

    console.log('\n2️⃣ Going to Messages page...');
    await page.goto('http://localhost:3005/messages');
    await page.waitForSelector('.w-80.border-r');
    console.log('✅ Messages page loaded');

    console.log('\n3️⃣ Opening New Message modal...');
    const newButton = await page.waitForSelector('button:has-text("New")');
    await newButton.click();
    
    await page.waitForSelector('[role="dialog"]');
    console.log('✅ Modal opened');

    console.log('\n4️⃣ Waiting for clients to load...');
    await page.waitForTimeout(3000); // Give time for clients to load

    // Check if clients loaded
    const clientButtons = await page.$$('button[class*="w-full justify-start"]');
    console.log(`📊 Found ${clientButtons.length} client buttons`);

    if (clientButtons.length === 0) {
      console.log('❌ No clients found in modal - checking loading state...');
      const loadingText = await page.$('text=Loading clients...');
      if (loadingText) {
        console.log('⏳ Still loading clients...');
        await page.waitForTimeout(5000);
      }
      
      // Check for error messages
      const errorText = await page.$('text*=Error');
      if (errorText) {
        const errorContent = await errorText.textContent();
        console.log('❌ Error in modal:', errorContent);
      }
    } else {
      console.log('\n5️⃣ Attempting to create conversation with first client...');
      
      // Get first client button details
      const firstClient = clientButtons[0];
      const clientText = await firstClient.textContent();
      console.log(`🎯 Selecting client: ${clientText?.trim()}`);
      
      // Click the first client
      await firstClient.click();
      
      // Wait for response and check for errors
      await page.waitForTimeout(3000);
      
      // Check if modal closed (success) or if error appeared
      const modalStillOpen = await page.$('[role="dialog"]');
      if (modalStillOpen) {
        console.log('❌ Modal still open - likely an error occurred');
        
        // Look for toast notifications or error messages
        const toastError = await page.$('[data-sonner-toaster]');
        if (toastError) {
          const toastText = await toastError.textContent();
          console.log('🔔 Toast notification:', toastText);
        }
      } else {
        console.log('✅ Modal closed - conversation likely created');
      }
    }

    console.log('\n6️⃣ Checking network tab for API errors...');
    // The network errors would have been logged above via the response handler

    console.log('\n🔍 DEBUGGING COMPLETE');
    console.log('====================');
    console.log('Check the browser console and network tab for specific errors');
    console.log('Browser will stay open for 30 seconds for manual inspection');
    
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.log('💥 Test error:', error.message);
  } finally {
    await browser.close();
  }
}

// Start the debug session
debugNewConversation().catch(console.error);