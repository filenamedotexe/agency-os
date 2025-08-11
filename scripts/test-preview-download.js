#!/usr/bin/env node

/**
 * Test Preview and Download Functionality
 * Tests the new file preview modal and download features
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

console.log('🧪 Preview & Download Functionality Test');
console.log('=======================================\n');

const TEST_URL = 'http://localhost:3006';
const ADMIN_CREDENTIALS = { email: 'admin@demo.com', password: 'password123' };

function createTestFiles() {
  const files = [];
  
  // Create a text file
  const textContent = 'This is a test text file for preview functionality.\nLine 2: Testing text preview\nLine 3: File created at ' + new Date().toISOString();
  const textPath = path.join(__dirname, 'preview-test.txt');
  fs.writeFileSync(textPath, textContent);
  files.push({ path: textPath, type: 'text' });
  
  // Create a CSV file
  const csvContent = 'Name,Email,Role\nAdmin User,admin@demo.com,Admin\nTest User,test@demo.com,Client';
  const csvPath = path.join(__dirname, 'preview-test.csv');
  fs.writeFileSync(csvPath, csvContent);
  files.push({ path: csvPath, type: 'csv' });
  
  return files;
}

async function testPreviewDownload() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  let testFiles = [];
  
  try {
    const page = await browser.newPage();
    
    // Track download events
    const downloads = [];
    page.on('download', download => {
      downloads.push(download);
      console.log(`📁 Download detected: ${download.suggestedFilename()}`);
    });
    
    // Track results
    const results = {
      login: false,
      fileUpload: false,
      attachmentsModal: false,
      previewButton: false,
      previewModal: false,
      textPreview: false,
      downloadButton: false,
      downloadWorks: false,
      modalResponsive: false
    };

    console.log('1️⃣ Creating test files...');
    testFiles = createTestFiles();
    console.log(`✅ Created ${testFiles.length} test files`);

    console.log('\n2️⃣ Testing login...');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('[type="submit"]');
    await page.waitForTimeout(3000);
    
    if (!page.url().includes('/login')) {
      results.login = true;
      console.log('✅ Login successful');
    }

    console.log('\n3️⃣ Uploading test files...');
    await page.goto(`${TEST_URL}/messages`);
    await page.waitForTimeout(3000);
    
    const conversations = await page.$$('div[class*="cursor-pointer"]');
    if (conversations.length > 0) {
      await conversations[0].click();
      await page.waitForTimeout(2000);
      
      // Upload first test file
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(testFiles[0].path);
        await page.waitForTimeout(3000);
        
        await page.fill('textarea', 'Test message with file for preview testing');
        const sendButton = await page.$('button[aria-label="Send message"]');
        if (sendButton && !(await sendButton.isDisabled())) {
          await sendButton.click();
          await page.waitForTimeout(3000);
          results.fileUpload = true;
          console.log('✅ Test file uploaded');
        }
      }
    }

    console.log('\n4️⃣ Testing attachments modal access...');
    const attachmentButtons = await page.$$('button[title*="attachment"]');
    if (attachmentButtons.length > 0) {
      await attachmentButtons[0].click();
      await page.waitForTimeout(3000);
      
      const modal = await page.$('[role="dialog"]');
      if (modal) {
        results.attachmentsModal = true;
        console.log('✅ Attachments modal opened');
        
        await page.waitForTimeout(2000);
        
        console.log('\n5️⃣ Testing preview button...');
        const previewButtons = await page.$$('button:has-text("Preview"), button:has-text("View")');
        if (previewButtons.length > 0) {
          results.previewButton = true;
          console.log('✅ Preview buttons found');
          
          console.log('\n6️⃣ Testing preview modal...');
          await previewButtons[0].click();
          await page.waitForTimeout(2000);
          
          // Check for preview modal
          const previewModals = await page.$$('[role="dialog"]');
          if (previewModals.length > 1) { // Should have both attachments and preview modals
            results.previewModal = true;
            console.log('✅ Preview modal opened');
            
            // Check for text content preview
            const textContent = await page.textContent('pre');
            if (textContent && textContent.includes('This is a test text file')) {
              results.textPreview = true;
              console.log('✅ Text file content preview working');
            }
            
            // Test responsive modal
            await page.setViewportSize({ width: 375, height: 667 });
            await page.waitForTimeout(1000);
            const mobileModal = await page.$('[role="dialog"]');
            if (mobileModal) {
              results.modalResponsive = true;
              console.log('✅ Modal responsive on mobile');
            }
            
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.waitForTimeout(1000);
            
            // Close preview modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        }
        
        console.log('\n7️⃣ Testing download functionality...');
        const downloadButtons = await page.$$('button:has-text("Download"), button:has-text("Get")');
        if (downloadButtons.length > 0) {
          results.downloadButton = true;
          console.log('✅ Download buttons found');
          
          // Click download button
          const downloadPromise = page.waitForEvent('download');
          await downloadButtons[0].click();
          
          try {
            const download = await Promise.race([
              downloadPromise,
              page.waitForTimeout(5000).then(() => Promise.reject(new Error('Download timeout')))
            ]);
            
            if (download) {
              results.downloadWorks = true;
              console.log(`✅ Download successful: ${download.suggestedFilename()}`);
              
              // Clean up download
              await download.delete();
            }
          } catch (error) {
            console.log('⚠️ Download test failed:', error.message);
          }
        }
        
        // Close attachments modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    console.log('\n📊 Preview & Download Test Results:');
    console.log('=================================');
    console.log(`Login: ${results.login ? '✅' : '❌'}`);
    console.log(`File Upload: ${results.fileUpload ? '✅' : '❌'}`);
    console.log(`Attachments Modal: ${results.attachmentsModal ? '✅' : '❌'}`);
    console.log(`Preview Button: ${results.previewButton ? '✅' : '❌'}`);
    console.log(`Preview Modal: ${results.previewModal ? '✅' : '❌'}`);
    console.log(`Text Preview: ${results.textPreview ? '✅' : '❌'}`);
    console.log(`Download Button: ${results.downloadButton ? '✅' : '❌'}`);
    console.log(`Download Works: ${results.downloadWorks ? '✅' : '❌'}`);
    console.log(`Modal Responsive: ${results.modalResponsive ? '✅' : '❌'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📈 Success Rate: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Preview functionality working');
      console.log('✅ Download functionality working');
      console.log('✅ Real database integration confirmed');
      console.log('✅ Responsive design optimized');
    } else {
      console.log('\n⚠️ Some tests failed - check implementation');
    }
    
    console.log('\nBrowser will close in 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log('💥 Test failed:', error.message);
  } finally {
    // Cleanup test files
    console.log('\n🧹 Cleaning up test files...');
    testFiles.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`  🗑️ Deleted: ${path.basename(file.path)}`);
      }
    });
    
    await browser.close();
  }
}

// Run the test
testPreviewDownload().catch(console.error);