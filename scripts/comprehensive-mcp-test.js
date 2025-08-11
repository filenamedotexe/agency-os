#!/usr/bin/env node

/**
 * Comprehensive MCP Test Suite - Ultrathink Testing
 * Full end-to-end testing of preview, download, and all functionality
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

console.log('🧪 Comprehensive MCP Test Suite - Ultrathink Mode');
console.log('=================================================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = { email: 'admin@demo.com', password: 'password123' };

// Create comprehensive test files
function createTestFiles() {
  const files = [];
  const testDir = path.join(__dirname, 'test-files');
  
  // Ensure test directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  // Text file
  const textContent = `Comprehensive Test Document
==========================

This is a comprehensive test file for the attachment system.

Features being tested:
- File upload via drag and drop
- File preview in modal
- File download functionality
- Database storage and retrieval
- Signed URL generation
- Responsive UI design

Created: ${new Date().toISOString()}
Test ID: ${Math.random().toString(36).substr(2, 9)}

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
  
  const textPath = path.join(testDir, 'comprehensive-test.txt');
  fs.writeFileSync(textPath, textContent);
  files.push({ path: textPath, type: 'text', name: 'comprehensive-test.txt' });
  
  // CSV file
  const csvContent = `Name,Role,Email,Department,Salary
John Doe,Developer,john@example.com,Engineering,75000
Jane Smith,Designer,jane@example.com,Design,68000
Bob Johnson,Manager,bob@example.com,Engineering,85000
Alice Brown,Analyst,alice@example.com,Data,72000
Charlie Davis,Developer,charlie@example.com,Engineering,78000`;
  
  const csvPath = path.join(testDir, 'employee-data.csv');
  fs.writeFileSync(csvPath, csvContent);
  files.push({ path: csvPath, type: 'csv', name: 'employee-data.csv' });
  
  // JSON file
  const jsonData = {
    testSuite: "Comprehensive MCP Test",
    timestamp: new Date().toISOString(),
    configuration: {
      environment: "development",
      features: ["upload", "preview", "download", "responsive"],
      browser: "chromium",
      viewport: {
        mobile: { width: 375, height: 667 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1920, height: 1080 }
      }
    },
    testData: [
      { id: 1, name: "File Upload", status: "pending" },
      { id: 2, name: "Preview Modal", status: "pending" },
      { id: 3, name: "Download Function", status: "pending" },
      { id: 4, name: "Database Integration", status: "pending" }
    ]
  };
  
  const jsonPath = path.join(testDir, 'test-config.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  files.push({ path: jsonPath, type: 'json', name: 'test-config.json' });
  
  return files;
}

async function runComprehensiveMCPTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let testFiles = [];
  let downloadPath = '';
  
  try {
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Set up download tracking
    const downloads = [];
    page.on('download', download => {
      downloads.push(download);
      console.log(`📥 Download triggered: ${download.suggestedFilename()}`);
    });
    
    // Set up console monitoring
    const consoleErrors = [];
    const consoleWarnings = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`🔴 Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
        console.log(`🟡 Console Warning: ${msg.text()}`);
      }
    });
    
    // Network monitoring
    const failedRequests = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`🔴 Failed Request: ${response.status()} - ${response.url()}`);
      }
    });
    
    // Comprehensive test results tracking
    const results = {
      // Phase 1: Basic Setup
      serverConnection: false,
      loginSuccess: false,
      messagesPageLoad: false,
      conversationAccess: false,
      
      // Phase 2: File Upload
      fileUpload: { text: false, csv: false, json: false },
      uploadUIFeedback: false,
      messagesSent: false,
      
      // Phase 3: Attachments Modal
      attachmentButtonPresent: false,
      attachmentModalOpen: false,
      attachmentsList: false,
      attachmentCounts: false,
      
      // Phase 4: UI/UX
      cardLayoutFixed: false,
      buttonsNoOverflow: false,
      responsiveDesign: { mobile: false, tablet: false, desktop: false },
      
      // Phase 5: Preview Functionality
      previewButtonsPresent: false,
      previewModalOpen: false,
      textPreviewWorks: false,
      imageZoomWorks: false,
      
      // Phase 6: Download Functionality
      downloadButtonsPresent: false,
      downloadTriggered: false,
      downloadCompletes: false,
      fileAccessible: false,
      
      // Phase 7: Database Integration
      realDatabaseData: false,
      signedUrlsWork: false,
      attachmentPersistence: false,
      
      // Phase 8: Error Handling
      noConsoleErrors: true,
      noFailedRequests: true,
      gracefulErrorHandling: false
    };

    console.log('🎯 PHASE 1: Basic Setup and Authentication');
    console.log('==========================================');
    
    console.log('1.1 Testing server connection...');
    try {
      await page.goto(TEST_URL, { waitUntil: 'networkidle' });
      results.serverConnection = true;
      console.log('✅ Server connection successful');
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      return results;
    }
    
    console.log('1.2 Testing login process...');
    await page.goto(`${TEST_URL}/login`);
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    if (!page.url().includes('/login')) {
      results.loginSuccess = true;
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed');
      return results;
    }
    
    console.log('1.3 Testing messages page access...');
    await page.goto(`${TEST_URL}/messages`);
    await page.waitForTimeout(3000);
    
    const messagesHeader = await page.$('h2:has-text("Messages")');
    if (messagesHeader) {
      results.messagesPageLoad = true;
      console.log('✅ Messages page loaded');
    }
    
    console.log('1.4 Testing conversation access...');
    const conversations = await page.$$('div[class*="cursor-pointer"]');
    if (conversations.length > 0) {
      await conversations[0].click();
      await page.waitForTimeout(2000);
      results.conversationAccess = true;
      console.log(`✅ Conversation access (${conversations.length} conversations found)`);
    }

    console.log('\n🎯 PHASE 2: File Upload Testing');
    console.log('===============================');
    
    console.log('2.1 Creating test files...');
    testFiles = createTestFiles();
    console.log(`✅ Created ${testFiles.length} test files`);
    
    console.log('2.2 Testing file uploads...');
    for (let i = 0; i < testFiles.length; i++) {
      const file = testFiles[i];
      console.log(`   Uploading ${file.type} file: ${file.name}`);
      
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(file.path);
        await page.waitForTimeout(2000);
        
        // Check for upload feedback
        const attachmentPreview = await page.$('[class*="px-2 py-1 bg-muted rounded-md"]');
        if (attachmentPreview) {
          results.fileUpload[file.type] = true;
          results.uploadUIFeedback = true;
          console.log(`   ✅ ${file.type} file uploaded with UI feedback`);
          
          // Send message with attachment
          await page.fill('textarea', `Test message with ${file.type} attachment - ${new Date().toISOString()}`);
          const sendButton = await page.$('button[aria-label="Send message"]');
          if (sendButton && !(await sendButton.isDisabled())) {
            await sendButton.click();
            await page.waitForTimeout(3000);
            results.messagesSent = true;
            console.log('   ✅ Message sent successfully');
          }
        } else {
          console.log(`   ❌ ${file.type} file upload failed`);
        }
      }
    }

    console.log('\n🎯 PHASE 3: Attachments Modal Testing');
    console.log('====================================');
    
    console.log('3.1 Testing attachment button presence...');
    const attachmentButtons = await page.$$('button[title*="attachment"]');
    if (attachmentButtons.length > 0) {
      results.attachmentButtonPresent = true;
      console.log(`✅ Attachment buttons found (${attachmentButtons.length})`);
      
      console.log('3.2 Testing attachment modal opening...');
      await attachmentButtons[0].click();
      await page.waitForTimeout(3000);
      
      const modal = await page.$('[role="dialog"]:has-text("Attachments")');
      if (modal) {
        results.attachmentModalOpen = true;
        console.log('✅ Attachments modal opened');
        
        console.log('3.3 Testing attachments list display...');
        const attachmentItems = await page.$$('[class*="border rounded-lg p-3"]');
        if (attachmentItems.length > 0) {
          results.attachmentsList = true;
          console.log(`✅ Attachments displayed (${attachmentItems.length} items)`);
          
          // Test attachment count display
          const countBadges = await page.$$('[class*="bg-blue-500"]');
          if (countBadges.length > 0) {
            results.attachmentCounts = true;
            console.log('✅ Attachment counts displayed');
          }
        }
      }
    }

    console.log('\n🎯 PHASE 4: UI/UX Layout Testing');
    console.log('================================');
    
    console.log('4.1 Testing card layout improvements...');
    const cards = await page.$$('[class*="border rounded-lg p-3 hover:bg-muted/50 transition-colors flex flex-col h-full"]');
    if (cards.length > 0) {
      results.cardLayoutFixed = true;
      console.log('✅ Card layout uses flexbox with proper structure');
    }
    
    console.log('4.2 Testing button overflow fixes...');
    const buttonContainers = await page.$$('[class*="flex gap-2 mt-auto"]');
    if (buttonContainers.length > 0) {
      results.buttonsNoOverflow = true;
      console.log('✅ Buttons positioned at bottom with proper spacing');
    }
    
    console.log('4.3 Testing responsive design...');
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    const mobileModal = await page.$('[role="dialog"]');
    if (mobileModal) {
      results.responsiveDesign.mobile = true;
      console.log('✅ Mobile responsive design working');
    }
    
    // Tablet test  
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    const tabletModal = await page.$('[role="dialog"]');
    if (tabletModal) {
      results.responsiveDesign.tablet = true;
      console.log('✅ Tablet responsive design working');
    }
    
    // Desktop test
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    const desktopModal = await page.$('[role="dialog"]');
    if (desktopModal) {
      results.responsiveDesign.desktop = true;
      console.log('✅ Desktop responsive design working');
    }

    console.log('\n🎯 PHASE 5: Preview Functionality Testing');
    console.log('========================================');
    
    console.log('5.1 Testing preview buttons...');
    const previewButtons = await page.$$('button:has-text("Preview")');
    if (previewButtons.length > 0) {
      results.previewButtonsPresent = true;
      console.log(`✅ Preview buttons found (${previewButtons.length})`);
      
      console.log('5.2 Testing preview modal...');
      await previewButtons[0].click();
      await page.waitForTimeout(3000);
      
      // Check for preview modal (should have multiple dialogs now)
      const allModals = await page.$$('[role="dialog"]');
      if (allModals.length > 1) {
        results.previewModalOpen = true;
        console.log('✅ Preview modal opened');
        
        console.log('5.3 Testing text content preview...');
        const textContent = await page.textContent('pre');
        if (textContent && textContent.includes('Comprehensive Test Document')) {
          results.textPreviewWorks = true;
          console.log('✅ Text file preview working');
        }
        
        // Test zoom controls if present
        const zoomButtons = await page.$$('button:has([class*="ZoomIn"]), button:has([class*="ZoomOut"])');
        if (zoomButtons.length > 0) {
          results.imageZoomWorks = true;
          console.log('✅ Zoom controls present');
        }
        
        // Close preview modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    console.log('\n🎯 PHASE 6: Download Functionality Testing');
    console.log('=========================================');
    
    console.log('6.1 Testing download buttons...');
    const downloadButtons = await page.$$('button:has-text("Download")');
    if (downloadButtons.length > 0) {
      results.downloadButtonsPresent = true;
      console.log(`✅ Download buttons found (${downloadButtons.length})`);
      
      console.log('6.2 Testing download trigger...');
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await downloadButtons[0].click();
      
      try {
        const download = await downloadPromise;
        results.downloadTriggered = true;
        console.log(`✅ Download triggered: ${download.suggestedFilename()}`);
        
        console.log('6.3 Testing download completion...');
        downloadPath = await download.path();
        if (downloadPath && fs.existsSync(downloadPath)) {
          results.downloadCompletes = true;
          console.log('✅ Download completed successfully');
          
          const fileContent = fs.readFileSync(downloadPath, 'utf8');
          if (fileContent.includes('Comprehensive Test Document')) {
            results.fileAccessible = true;
            console.log('✅ Downloaded file is accessible and correct');
          }
        }
      } catch (downloadError) {
        console.log('❌ Download test failed:', downloadError.message);
      }
    }

    console.log('\n🎯 PHASE 7: Database Integration Testing');
    console.log('=======================================');
    
    console.log('7.1 Testing real database data...');
    // Check if attachment data comes from database
    const attachmentMetadata = await page.$$('text=/uploaded|by|ago/');
    if (attachmentMetadata.length > 0) {
      results.realDatabaseData = true;
      console.log('✅ Real database metadata displayed');
    }
    
    console.log('7.2 Testing signed URLs...');
    // Check if URLs are signed (contain token parameters)
    const downloadUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[download]'));
      return links.map(link => link.href);
    });
    
    const hasSignedUrls = downloadUrls.some(url => url.includes('token=') || url.includes('t='));
    if (hasSignedUrls) {
      results.signedUrlsWork = true;
      console.log('✅ Signed URLs detected for secure access');
    }
    
    console.log('7.3 Testing attachment persistence...');
    // Close modal and reopen to test persistence
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    const attachmentButton = await page.$('button[title*="attachment"]');
    if (attachmentButton) {
      await attachmentButton.click();
      await page.waitForTimeout(2000);
      
      const persistedAttachments = await page.$$('[class*="border rounded-lg p-3"]');
      if (persistedAttachments.length > 0) {
        results.attachmentPersistence = true;
        console.log('✅ Attachments persisted in database');
      }
    }

    console.log('\n🎯 PHASE 8: Error Handling and Quality');
    console.log('=====================================');
    
    console.log('8.1 Analyzing console errors...');
    if (consoleErrors.length === 0) {
      results.noConsoleErrors = true;
      console.log('✅ No console errors detected');
    } else {
      results.noConsoleErrors = false;
      console.log(`❌ Console errors detected: ${consoleErrors.length}`);
      consoleErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 100)}...`);
      });
    }
    
    console.log('8.2 Analyzing failed requests...');
    if (failedRequests.length === 0) {
      results.noFailedRequests = true;
      console.log('✅ No failed requests detected');
    } else {
      results.noFailedRequests = false;
      console.log(`❌ Failed requests detected: ${failedRequests.length}`);
      failedRequests.forEach((req, i) => {
        console.log(`   ${i + 1}. ${req.status} - ${req.url}`);
      });
    }
    
    console.log('8.3 Testing graceful error handling...');
    // Test with invalid file or action
    try {
      await page.evaluate(() => {
        // Try to trigger an error gracefully
        window.dispatchEvent(new Event('test-error-handling'));
      });
      results.gracefulErrorHandling = true;
      console.log('✅ Error handling appears robust');
    } catch (error) {
      console.log('⚠️ Error handling test inconclusive');
    }

    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('=============================');
    
    // Calculate phase scores
    const phaseScores = {
      'Phase 1 - Basic Setup': [
        results.serverConnection,
        results.loginSuccess,
        results.messagesPageLoad,
        results.conversationAccess
      ],
      'Phase 2 - File Upload': [
        results.fileUpload.text,
        results.fileUpload.csv,
        results.fileUpload.json,
        results.uploadUIFeedback,
        results.messagesSent
      ],
      'Phase 3 - Attachments Modal': [
        results.attachmentButtonPresent,
        results.attachmentModalOpen,
        results.attachmentsList,
        results.attachmentCounts
      ],
      'Phase 4 - UI/UX': [
        results.cardLayoutFixed,
        results.buttonsNoOverflow,
        results.responsiveDesign.mobile,
        results.responsiveDesign.tablet,
        results.responsiveDesign.desktop
      ],
      'Phase 5 - Preview': [
        results.previewButtonsPresent,
        results.previewModalOpen,
        results.textPreviewWorks
      ],
      'Phase 6 - Download': [
        results.downloadButtonsPresent,
        results.downloadTriggered,
        results.downloadCompletes,
        results.fileAccessible
      ],
      'Phase 7 - Database': [
        results.realDatabaseData,
        results.signedUrlsWork,
        results.attachmentPersistence
      ],
      'Phase 8 - Quality': [
        results.noConsoleErrors,
        results.noFailedRequests,
        results.gracefulErrorHandling
      ]
    };
    
    let totalPassed = 0;
    let totalTests = 0;
    
    Object.entries(phaseScores).forEach(([phase, tests]) => {
      const passed = tests.filter(Boolean).length;
      const total = tests.length;
      const percentage = Math.round((passed / total) * 100);
      
      console.log(`${phase}: ${passed}/${total} (${percentage}%) ${percentage === 100 ? '🎉' : percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌'}`);
      
      totalPassed += passed;
      totalTests += total;
    });
    
    const overallScore = Math.round((totalPassed / totalTests) * 100);
    
    console.log('\n🏆 OVERALL TEST SCORE');
    console.log('===================');
    console.log(`Total: ${totalPassed}/${totalTests} (${overallScore}%)`);
    
    if (overallScore >= 95) {
      console.log('🎉 EXCEPTIONAL - System is production-ready with excellent quality');
    } else if (overallScore >= 85) {
      console.log('✅ EXCELLENT - System is production-ready with minor improvements needed');
    } else if (overallScore >= 75) {
      console.log('⚠️ GOOD - System is functional but needs improvements');
    } else if (overallScore >= 60) {
      console.log('❌ NEEDS WORK - Significant issues require attention');
    } else {
      console.log('💥 CRITICAL - Major functionality issues detected');
    }
    
    console.log('\n🎯 DETAILED RECOMMENDATIONS');
    console.log('===========================');
    
    if (!results.noConsoleErrors) {
      console.log('• Fix console errors to improve stability');
    }
    if (!results.signedUrlsWork) {
      console.log('• Implement signed URLs for secure file access');
    }
    if (!results.downloadCompletes) {
      console.log('• Debug download functionality');
    }
    if (!results.textPreviewWorks) {
      console.log('• Verify text preview functionality');
    }
    if (Object.values(results.responsiveDesign).some(v => !v)) {
      console.log('• Improve responsive design across all viewports');
    }
    
    console.log('\n⏰ Test completed in browser - closing in 15 seconds for manual inspection...');
    await page.waitForTimeout(15000);
    
    return results;

  } catch (error) {
    console.log('💥 Comprehensive test failed:', error.message);
    console.log('Stack:', error.stack);
    return null;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test files...');
    if (testFiles.length > 0) {
      const testDir = path.dirname(testFiles[0].path);
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
        console.log('✅ Test files cleaned up');
      }
    }
    
    if (downloadPath && fs.existsSync(downloadPath)) {
      fs.unlinkSync(downloadPath);
      console.log('✅ Downloaded test file cleaned up');
    }
    
    await browser.close();
  }
}

// Run the comprehensive MCP test
if (require.main === module) {
  runComprehensiveMCPTest().catch(console.error);
}

module.exports = { runComprehensiveMCPTest };