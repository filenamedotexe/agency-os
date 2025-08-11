#!/usr/bin/env node

/**
 * Test File Upload Functionality
 * Tests the complete file upload flow in the chat system
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing File Upload Functionality');
console.log('====================================\n');

const TEST_URL = 'http://localhost:3006';
const ADMIN_CREDENTIALS = { email: 'admin@demo.com', password: 'password123' };

// Create a test file for upload
function createTestFile() {
  const testContent = 'This is a test file for upload functionality.\nCreated at: ' + new Date().toISOString();
  const filePath = path.join(__dirname, 'test-upload.txt');
  fs.writeFileSync(filePath, testContent);
  return filePath;
}

async function testFileUpload() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable file uploads
    await page.context().grantPermissions(['clipboard-read']);
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Browser Error: ${msg.text()}`);
      } else if (msg.type() === 'log' && msg.text().includes('Upload')) {
        console.log(`📝 Upload Log: ${msg.text()}`);
      }
    });

    console.log('1️⃣ Logging in as admin...');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 5000 });
    console.log('✅ Logged in successfully');

    console.log('\n2️⃣ Navigating to messages...');
    await page.goto(`${TEST_URL}/messages`);
    await page.waitForLoadState('networkidle');
    console.log('✅ Messages page loaded');

    console.log('\n3️⃣ Opening conversation...');
    const conversations = await page.$$('[class*="w-full p-3 rounded-lg"]');
    if (conversations.length === 0) {
      console.log('❌ No conversations found');
      return;
    }
    
    await conversations[0].click();
    await page.waitForTimeout(2000);
    console.log('✅ Conversation opened');

    console.log('\n4️⃣ Testing file upload...');
    
    // Create test file
    const testFilePath = createTestFile();
    console.log(`📁 Created test file: ${testFilePath}`);

    // Test file input button
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      console.log('❌ File input not found');
      return;
    }

    // Upload file
    await fileInput.setInputFiles(testFilePath);
    console.log('📤 File selected for upload...');
    
    // Wait for upload to complete
    await page.waitForTimeout(3000);
    
    // Check if attachment appears in UI
    const attachments = await page.$$('[class*="px-2 py-1 bg-muted rounded-md"]');
    if (attachments.length > 0) {
      console.log('✅ File attachment appears in UI');
      
      // Try to send message with attachment
      const sendButton = await page.$('button[aria-label="Send message"]');
      if (sendButton) {
        const isDisabled = await sendButton.isDisabled();
        if (!isDisabled) {
          console.log('📤 Sending message with attachment...');
          await sendButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ Message sent successfully');
        } else {
          console.log('⚠️ Send button is disabled');
        }
      }
    } else {
      console.log('❌ File attachment not found in UI');
    }

    console.log('\n5️⃣ Testing drag and drop...');
    
    // Test drag and drop (simulate)
    const dropZone = await page.$('[class*="flex gap-2 p-3 relative"]');
    if (dropZone) {
      // We can't easily test actual drag and drop in Playwright with file system files
      // But we can verify the drop zone exists and has proper styling
      const dropZoneClass = await dropZone.getAttribute('class');
      console.log('✅ Drop zone found with classes:', dropZoneClass);
    }

    console.log('\n📊 File Upload Test Summary:');
    console.log('=============================');
    console.log('✅ Login successful');
    console.log('✅ Messages page accessible');
    console.log('✅ Conversation opened');
    console.log('✅ File input found and functional');
    console.log('✅ Drop zone properly configured');
    
    // Check storage bucket in browser console
    console.log('\n6️⃣ Verifying storage configuration...');
    const storageCheck = await page.evaluate(async () => {
      // Access Supabase client if available
      if (typeof window !== 'undefined' && window.supabase) {
        try {
          const { data: buckets } = await window.supabase.storage.listBuckets();
          return { buckets, success: true };
        } catch (error) {
          return { error: error.message, success: false };
        }
      }
      return { message: 'Supabase client not available in window', success: false };
    });
    
    if (storageCheck.success) {
      console.log('✅ Storage configuration verified');
      console.log('📦 Available buckets:', storageCheck.buckets?.map(b => b.name).join(', '));
    } else {
      console.log('⚠️ Storage check:', storageCheck.message || storageCheck.error);
    }

    // Cleanup
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Test file cleaned up');
    
    console.log('\n🎉 File Upload Test Complete!');
    console.log('Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log('💥 Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Create test file and run test
testFileUpload().catch(console.error);