#!/usr/bin/env node

/**
 * Test Profile Navigation & Attachments Modal
 * Tests the new profile and attachments functionality
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

console.log('🧪 Profile Navigation & Attachments Test');
console.log('=======================================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = { email: 'admin@demo.com', password: 'password123' };

function createTestFile() {
  const content = 'Test attachment for profile/attachments feature.\nCreated: ' + new Date().toISOString();
  const filePath = path.join(__dirname, 'profile-test.txt');
  fs.writeFileSync(filePath, content);
  return filePath;
}

async function testProfileAndAttachments() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500 
  });
  
  let testFilePath = null;
  
  try {
    const page = await browser.newPage();
    
    // Track results
    const results = {
      login: false,
      messagesAccess: false,
      attachmentUpload: false,
      profileIconVisible: false,
      profileNavigation: false,
      attachmentsIconVisible: false,
      attachmentsModalOpen: false,
      attachmentDisplayInModal: false
    };

    console.log('1️⃣ Creating test file...');
    testFilePath = createTestFile();
    console.log(`✅ Test file: ${path.basename(testFilePath)}`);

    console.log('\n2️⃣ Testing login...');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 5000 });
    results.login = true;
    console.log('✅ Login successful');

    console.log('\n3️⃣ Testing messages access...');
    await page.goto(`${TEST_URL}/messages`);
    await page.waitForLoadState('networkidle');
    results.messagesAccess = true;
    console.log('✅ Messages page loaded');

    console.log('\n4️⃣ Opening first conversation...');
    const conversations = await page.$$('[class*="w-full p-3 rounded-lg"]');
    if (conversations.length > 0) {
      await conversations[0].click();
      await page.waitForTimeout(2000);
      console.log('✅ Conversation opened');

      console.log('\n5️⃣ Testing file upload...');
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(testFilePath);
        await page.waitForTimeout(3000);
        
        // Send message with attachment
        await page.fill('textarea', 'Test message for profile/attachments feature');
        const sendButton = await page.$('button[aria-label="Send message"]');
        if (sendButton && !(await sendButton.isDisabled())) {
          await sendButton.click();
          await page.waitForTimeout(2000);
          results.attachmentUpload = true;
          console.log('✅ File uploaded and message sent');
        }
      }

      console.log('\n6️⃣ Testing profile icon visibility...');
      const profileIcons = await page.$$('button[title="View profile"]');
      if (profileIcons.length > 0) {
        results.profileIconVisible = true;
        console.log('✅ Profile icons visible in conversation list');
        
        console.log('\n7️⃣ Testing profile navigation...');
        const firstProfileIcon = profileIcons[0];
        
        // Listen for new tab/window
        const pagePromise = page.context().waitForEvent('page');
        await firstProfileIcon.click();
        
        try {
          const newPage = await pagePromise;
          await newPage.waitForLoadState();
          const url = newPage.url();
          
          if (url.includes('/clients/')) {
            results.profileNavigation = true;
            console.log('✅ Profile page opened in new tab');
            console.log(`   URL: ${url}`);
            await newPage.close();
          }
        } catch (error) {
          console.log('⚠️ Profile navigation test failed:', error.message);
        }
      }

      console.log('\n8️⃣ Testing attachments icon visibility...');
      const attachmentIcons = await page.$$('button[title*="attachments"]');
      if (attachmentIcons.length > 0) {
        results.attachmentsIconVisible = true;
        console.log('✅ Attachments icons visible in conversation list');
        
        console.log('\n9️⃣ Testing attachments modal...');
        const firstAttachmentIcon = attachmentIcons[0];
        await firstAttachmentIcon.click();
        await page.waitForTimeout(2000);
        
        // Check if modal opened
        const modal = await page.$('[role="dialog"]');
        if (modal) {
          results.attachmentsModalOpen = true;
          console.log('✅ Attachments modal opened');
          
          // Check for attachments in modal
          const attachmentItems = await page.$$('[class*="border rounded-lg p-3"]');
          if (attachmentItems.length > 0) {
            results.attachmentDisplayInModal = true;
            console.log('✅ Attachments displayed in modal');
            
            // Test download link
            const downloadLinks = await page.$$('a[download]');
            if (downloadLinks.length > 0) {
              console.log('✅ Download links present');
            }
          }
          
          // Close modal
          const closeButton = await page.$('button[aria-label*="Close"]') || await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        }
      }
    }

    console.log('\n📊 Profile & Attachments Test Results:');
    console.log('====================================');
    console.log(`Login: ${results.login ? '✅' : '❌'}`);
    console.log(`Messages Access: ${results.messagesAccess ? '✅' : '❌'}`);
    console.log(`Attachment Upload: ${results.attachmentUpload ? '✅' : '❌'}`);
    console.log(`Profile Icon Visible: ${results.profileIconVisible ? '✅' : '❌'}`);
    console.log(`Profile Navigation: ${results.profileNavigation ? '✅' : '❌'}`);
    console.log(`Attachments Icon Visible: ${results.attachmentsIconVisible ? '✅' : '❌'}`);
    console.log(`Attachments Modal Opens: ${results.attachmentsModalOpen ? '✅' : '❌'}`);
    console.log(`Attachments Display in Modal: ${results.attachmentDisplayInModal ? '✅' : '❌'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📈 Success Rate: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('Profile navigation and attachments functionality working correctly!');
    } else {
      console.log('\n⚠️ Some tests failed - check implementation');
    }
    
    console.log('\nBrowser will close in 10 seconds for inspection...');
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

// Run the test
testProfileAndAttachments().catch(console.error);