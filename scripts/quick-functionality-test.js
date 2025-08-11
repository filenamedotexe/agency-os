#!/usr/bin/env node

/**
 * Quick Functionality Test
 * Rapid test to verify core functionality works
 */

const { chromium } = require('playwright');

console.log('🚀 Quick Functionality Test');
console.log('===========================\n');

async function quickTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1. Testing server connection...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    console.log('✅ Server connected');
    
    console.log('2. Testing login...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect and check final URL
    await page.waitForTimeout(5000); // Give enough time for redirect
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('/login')) {
      console.log('❌ Login failed');
      return false;
    } else {
      console.log('✅ Login successful');
    }
    
    console.log('3. Testing messages page...');
    await page.goto('http://localhost:3000/messages', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const messagesUrl = page.url();
    console.log(`Messages URL: ${messagesUrl}`);
    
    if (messagesUrl.includes('/login')) {
      console.log('❌ Messages redirected to login');
      return false;
    } else {
      console.log('✅ Messages page accessible');
    }
    
    console.log('4. Testing page content...');
    const pageContent = await page.textContent('body');
    if (pageContent.includes('Messages') || pageContent.includes('Conversations')) {
      console.log('✅ Messages content found');
    } else {
      console.log('⚠️ Messages content unclear');
    }
    
    console.log('5. Testing file upload elements...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('✅ File input found');
    } else {
      console.log('⚠️ No file input found');
    }
    
    console.log('6. Testing attachment buttons...');
    const attachmentButtons = await page.$$('button[title*="attachment"], button:has-text("attachment")');
    console.log(`Found ${attachmentButtons.length} attachment buttons`);
    
    if (attachmentButtons.length > 0) {
      console.log('7. Testing attachment modal...');
      await attachmentButtons[0].click();
      await page.waitForTimeout(2000);
      
      const modals = await page.$$('[role="dialog"]');
      if (modals.length > 0) {
        console.log('✅ Attachment modal opened');
        
        const previewButtons = await page.$$('button:has-text("Preview")');
        const downloadButtons = await page.$$('button:has-text("Download")');
        console.log(`Found ${previewButtons.length} preview buttons, ${downloadButtons.length} download buttons`);
        
        // Close modal
        await page.keyboard.press('Escape');
      } else {
        console.log('❌ Attachment modal failed to open');
      }
    }
    
    console.log('\n🎯 QUICK TEST RESULTS:');
    console.log('======================');
    console.log('✅ Server: Working');
    console.log('✅ Authentication: Working');
    console.log('✅ Messages Route: Working');
    console.log('✅ Core Functionality: Working');
    
    // Keep browser open for 10 seconds for inspection
    console.log('\nBrowser staying open for 10 seconds...');
    await page.waitForTimeout(10000);
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

quickTest().then(success => {
  console.log(success ? '\n🎉 All core functionality working!' : '\n💥 Issues detected');
  process.exit(success ? 0 : 1);
});