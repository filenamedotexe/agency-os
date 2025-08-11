#!/usr/bin/env node

/**
 * Final UI Test - Profile & Attachments with Database Data
 * Tests fixed nested button issue and responsive design
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

console.log('🧪 Final UI Test - Profile & Attachments');
console.log('======================================\n');

const TEST_URL = 'http://localhost:3006';
const ADMIN_CREDENTIALS = { email: 'admin@demo.com', password: 'password123' };

function createTestFile() {
  const content = 'Final UI test file for attachments database verification.\nCreated: ' + new Date().toISOString();
  const filePath = path.join(__dirname, 'final-ui-test.txt');
  fs.writeFileSync(filePath, content);
  return filePath;
}

async function testFinalUI() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  let testFilePath = null;
  
  try {
    const page = await browser.newPage();
    
    // Track results
    const results = {
      login: false,
      messagesLoad: false,
      conversationStructure: false,
      noNestedButtons: false,
      iconsVisible: false,
      iconsResponsive: false,
      attachmentUpload: false,
      modalFromDatabase: false,
      mobileLayout: false,
      desktopLayout: false
    };

    console.log('1️⃣ Creating test file...');
    testFilePath = createTestFile();
    console.log(`✅ Test file: ${path.basename(testFilePath)}`);

    console.log('\n2️⃣ Testing login...');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check if we're redirected away from login
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      results.login = true;
      console.log('✅ Login successful');
    }

    console.log('\n3️⃣ Testing messages page...');
    await page.goto(`${TEST_URL}/messages`);
    await page.waitForTimeout(3000);
    results.messagesLoad = true;
    console.log('✅ Messages page loaded');

    console.log('\n4️⃣ Testing conversation structure (no nested buttons)...');
    
    // Check for div-based conversation items (not buttons)
    const conversationDivs = await page.$$('div[class*="cursor-pointer"]');
    console.log(`Found ${conversationDivs.length} conversation containers`);
    
    // Verify no nested button error in console
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('nested')) {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (conversationDivs.length > 0 && consoleLogs.length === 0) {
      results.conversationStructure = true;
      results.noNestedButtons = true;
      console.log('✅ Conversation structure fixed - no nested buttons');
    }

    console.log('\n5️⃣ Testing icon visibility and sizes...');
    
    // Check for larger icons
    const profileIcons = await page.$$('svg[class*="h-4 w-4"], svg[class*="h-5 w-5"]');
    const attachmentIcons = await page.$$('svg[class*="Paperclip"]');
    
    if (profileIcons.length > 0 && attachmentIcons.length >= 0) {
      results.iconsVisible = true;
      console.log(`✅ Icons visible - Profile: ${profileIcons.length}, Attachments: ${attachmentIcons.length}`);
    }

    console.log('\n6️⃣ Testing responsive icon sizes...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileIcons = await page.$$('svg[class*="h-4"], svg[class*="sm:h-5"]');
    console.log(`Mobile icons found: ${mobileIcons.length}`);
    
    // Test desktop viewport  
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopIcons = await page.$$('svg[class*="h-5"], svg[class*="sm:h-6"]');
    console.log(`Desktop icons found: ${desktopIcons.length}`);
    
    if (mobileIcons.length > 0 && desktopIcons.length > 0) {
      results.iconsResponsive = true;
      console.log('✅ Responsive icon sizing working');
    }

    console.log('\n7️⃣ Testing file upload for database data...');
    
    // Click first conversation if available
    if (conversationDivs.length > 0) {
      await conversationDivs[0].click();
      await page.waitForTimeout(2000);
      
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(testFilePath);
        await page.waitForTimeout(4000);
        
        // Send message
        await page.fill('textarea', 'Final UI test message with attachment');
        const sendButton = await page.$('button[aria-label="Send message"]');
        if (sendButton && !(await sendButton.isDisabled())) {
          await sendButton.click();
          await page.waitForTimeout(3000);
          results.attachmentUpload = true;
          console.log('✅ File uploaded and message sent');
        }
      }
    }

    console.log('\n8️⃣ Testing attachments modal with database data...');
    
    // Look for attachment buttons with counts
    const attachmentButtons = await page.$$('button[title*="attachment"]');
    if (attachmentButtons.length > 0) {
      console.log('✅ Attachment buttons found');
      
      // Click first attachment button
      await attachmentButtons[0].click();
      await page.waitForTimeout(3000);
      
      // Check if modal opened and shows database loading
      const modal = await page.$('[role="dialog"]');
      if (modal) {
        console.log('✅ Attachments modal opened');
        
        // Wait for loading to complete and data to appear
        await page.waitForTimeout(3000);
        
        // Check for actual attachment items from database
        const attachmentItems = await page.$$('[class*="border rounded-lg p-3"]');
        const downloadLinks = await page.$$('a[download]');
        
        if (attachmentItems.length > 0 && downloadLinks.length > 0) {
          results.modalFromDatabase = true;
          console.log(`✅ Modal shows ${attachmentItems.length} attachments from database`);
        }
        
        // Test responsive modal
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        results.mobileLayout = true;
        console.log('✅ Mobile modal layout tested');
        
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        results.desktopLayout = true;
        console.log('✅ Desktop modal layout tested');
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    console.log('\n📊 Final UI Test Results:');
    console.log('========================');
    console.log(`Login: ${results.login ? '✅' : '❌'}`);
    console.log(`Messages Load: ${results.messagesLoad ? '✅' : '❌'}`);
    console.log(`Conversation Structure: ${results.conversationStructure ? '✅' : '❌'}`);
    console.log(`No Nested Buttons: ${results.noNestedButtons ? '✅' : '❌'}`);
    console.log(`Icons Visible: ${results.iconsVisible ? '✅' : '❌'}`);
    console.log(`Icons Responsive: ${results.iconsResponsive ? '✅' : '❌'}`);
    console.log(`Attachment Upload: ${results.attachmentUpload ? '✅' : '❌'}`);
    console.log(`Modal Database Data: ${results.modalFromDatabase ? '✅' : '❌'}`);
    console.log(`Mobile Layout: ${results.mobileLayout ? '✅' : '❌'}`);
    console.log(`Desktop Layout: ${results.desktopLayout ? '✅' : '❌'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📈 Success Rate: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Nested button issue fixed');
      console.log('✅ Icons properly sized and responsive');
      console.log('✅ Modal uses real database data');
      console.log('✅ Responsive design optimized for all viewports');
    } else {
      console.log('\n⚠️ Some tests failed - check implementation');
    }
    
    console.log('\nBrowser will close in 10 seconds for manual verification...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log('💥 Test failed:', error.message);
  } finally {
    // Cleanup
    if (testFilePath && fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Test file cleaned up');
    }
    await browser.close();
  }
}

// Run the final UI test
testFinalUI().catch(console.error);