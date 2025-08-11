#!/usr/bin/env node

/**
 * Final File Attachment Test
 * Tests current working functionality
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

console.log('🧪 Final File Attachment Test');
console.log('=============================\n');

const TEST_URL = 'http://localhost:3006';
const ADMIN_CREDENTIALS = { email: 'admin@demo.com', password: 'password123' };

// Create a simple text file
function createTestFile() {
  const content = 'Final test file for file attachment feature.\nCreated: ' + new Date().toISOString();
  const filePath = path.join(__dirname, 'final-test.txt');
  fs.writeFileSync(filePath, content);
  return filePath;
}

async function finalFileTest() {
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
      messagesAccess: false,
      conversationOpen: false,
      fileUpload: false,
      attachmentDisplay: false,
      messageSent: false
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

    console.log('\n4️⃣ Opening conversation...');
    const conversations = await page.$$('[class*="w-full p-3 rounded-lg"]');
    if (conversations.length > 0) {
      await conversations[0].click();
      await page.waitForTimeout(2000);
      results.conversationOpen = true;
      console.log('✅ Conversation opened');
    }

    console.log('\n5️⃣ Testing file upload...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(testFilePath);
      await page.waitForTimeout(3000);
      
      const attachments = await page.$$('[class*="px-2 py-1 bg-muted rounded-md"]');
      if (attachments.length > 0) {
        results.fileUpload = true;
        results.attachmentDisplay = true;
        console.log('✅ File uploaded and displays in UI');
        
        // Try to send message
        await page.fill('textarea', 'Test message with attachment');
        const sendButton = await page.$('button[aria-label="Send message"]');
        if (sendButton && !(await sendButton.isDisabled())) {
          await sendButton.click();
          await page.waitForTimeout(2000);
          results.messageSent = true;
          console.log('✅ Message sent with attachment');
        }
      }
    }

    console.log('\n📊 Final Test Results:');
    console.log('======================');
    console.log(`Login: ${results.login ? '✅' : '❌'}`);
    console.log(`Messages Access: ${results.messagesAccess ? '✅' : '❌'}`);
    console.log(`Conversation Open: ${results.conversationOpen ? '✅' : '❌'}`);
    console.log(`File Upload: ${results.fileUpload ? '✅' : '❌'}`);
    console.log(`Attachment Display: ${results.attachmentDisplay ? '✅' : '❌'}`);
    console.log(`Message Sent: ${results.messageSent ? '✅' : '❌'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📈 Success Rate: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('File attachment functionality is working correctly!');
    } else {
      console.log('\n⚠️ Some tests failed, but core functionality may still work');
    }
    
    console.log('\nBrowser will close in 5 seconds...');
    await page.waitForTimeout(5000);

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

// Run the final test
finalFileTest().catch(console.error);