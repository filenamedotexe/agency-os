#!/usr/bin/env node

/**
 * Debug Enhanced MCP Test Suite
 * Enhanced testing with detailed debugging and session handling
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

console.log('🐛 Debug Enhanced MCP Test Suite');
console.log('================================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = { email: 'admin@demo.com', password: 'password123' };

// Enhanced debugging function
function debugLog(phase, step, status, message, details = null) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const statusIcon = status === 'success' ? '✅' : status === 'error' ? '❌' : status === 'info' ? 'ℹ️' : '⚠️';
  
  console.log(`[${timestamp}] ${statusIcon} ${phase}.${step}: ${message}`);
  if (details) {
    console.log(`    Details: ${JSON.stringify(details, null, 2)}`);
  }
}

// Enhanced context creation with debugging
async function createDebugContext(browser) {
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1920, height: 1080 },
    // Persist storage and cookies
    storageState: undefined,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  // Enable request/response logging
  context.on('request', request => {
    debugLog('HTTP', 'REQ', 'info', `${request.method()} ${request.url()}`);
  });

  context.on('response', response => {
    const status = response.status();
    const statusType = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'success';
    debugLog('HTTP', 'RES', statusType, `${status} ${response.url()}`);
  });

  return context;
}

async function runEnhancedDebugTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let context;
  
  try {
    context = await createDebugContext(browser);
    const page = await context.newPage();
    
    // Enhanced error tracking
    const errors = {
      console: [],
      network: [],
      javascript: []
    };

    // Console monitoring with details
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        errors.console.push({ type, text, location: msg.location() });
        debugLog('CONSOLE', 'ERROR', 'error', text, msg.location());
      } else if (type === 'warning') {
        debugLog('CONSOLE', 'WARN', 'warn', text);
      }
    });

    // Network error monitoring
    page.on('response', response => {
      if (response.status() >= 400) {
        errors.network.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // JavaScript error monitoring
    page.on('pageerror', error => {
      errors.javascript.push({
        message: error.message,
        stack: error.stack
      });
      debugLog('JS', 'ERROR', 'error', error.message, { stack: error.stack });
    });

    debugLog('PHASE1', '1', 'info', 'Starting enhanced authentication test');
    
    // Phase 1: Enhanced Authentication with Session Persistence
    debugLog('PHASE1', '1.1', 'info', 'Testing server connection');
    await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    debugLog('PHASE1', '1.1', 'success', `Connected to ${TEST_URL}`);
    
    // Check initial redirect
    const initialUrl = page.url();
    debugLog('PHASE1', '1.2', 'info', `Initial URL after redirect: ${initialUrl}`);
    
    // Navigate to login if not already there
    if (!initialUrl.includes('/login')) {
      debugLog('PHASE1', '1.3', 'info', 'Navigating to login page');
      await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle' });
    }
    
    debugLog('PHASE1', '1.4', 'info', 'Performing login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    
    // Wait for and click login button
    const loginButton = await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
    await loginButton.click();
    debugLog('PHASE1', '1.4', 'info', 'Login form submitted');
    
    // Wait for redirect and verify authentication
    await page.waitForTimeout(3000);
    const postLoginUrl = page.url();
    debugLog('PHASE1', '1.5', 'info', `Post-login URL: ${postLoginUrl}`);
    
    if (postLoginUrl.includes('/login')) {
      debugLog('PHASE1', '1.5', 'error', 'Login failed - still on login page');
      return { success: false, errors };
    }
    
    // Save authentication state
    const storageState = await context.storageState();
    debugLog('PHASE1', '1.6', 'success', 'Authentication successful, state saved');
    
    // Phase 2: Enhanced Navigation Test
    debugLog('PHASE2', '2.1', 'info', 'Testing messages page access');
    
    // Try direct navigation to messages
    const messagesUrl = `${TEST_URL}/messages`;
    debugLog('PHASE2', '2.2', 'info', `Navigating to ${messagesUrl}`);
    
    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
    await page.goto(messagesUrl);
    
    try {
      await navigationPromise;
      const finalUrl = page.url();
      debugLog('PHASE2', '2.3', 'success', `Messages page loaded: ${finalUrl}`);
      
      // Verify page content
      const pageTitle = await page.textContent('h1, h2, [data-testid="page-title"]').catch(() => 'No title found');
      debugLog('PHASE2', '2.4', 'info', `Page title: ${pageTitle}`);
      
    } catch (navError) {
      debugLog('PHASE2', '2.3', 'error', 'Navigation timeout or error', navError.message);
    }
    
    // Phase 3: Session Persistence Test
    debugLog('PHASE3', '3.1', 'info', 'Testing session persistence');
    
    // Open new page with same context
    const page2 = await context.newPage();
    await page2.goto(messagesUrl, { waitUntil: 'domcontentloaded' });
    const secondPageUrl = page2.url();
    debugLog('PHASE3', '3.2', 'info', `Second page URL: ${secondPageUrl}`);
    
    if (secondPageUrl.includes('/login')) {
      debugLog('PHASE3', '3.2', 'error', 'Session not persisted - redirected to login');
    } else {
      debugLog('PHASE3', '3.2', 'success', 'Session persisted successfully');
    }
    
    // Phase 4: File Upload Test (if messages page accessible)
    if (!page.url().includes('/login')) {
      debugLog('PHASE4', '4.1', 'info', 'Testing file upload functionality');
      
      // Look for file input
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        debugLog('PHASE4', '4.2', 'success', 'File input found');
        
        // Create test file
        const testFilePath = path.join(__dirname, 'debug-test-file.txt');
        fs.writeFileSync(testFilePath, `Debug test file created at ${new Date().toISOString()}`);
        
        try {
          await fileInput.setInputFiles(testFilePath);
          debugLog('PHASE4', '4.3', 'success', 'Test file uploaded');
          
          // Wait for upload feedback
          await page.waitForTimeout(2000);
          const attachmentPreview = await page.$('[class*="px-2 py-1 bg-muted rounded-md"]');
          if (attachmentPreview) {
            debugLog('PHASE4', '4.4', 'success', 'Upload UI feedback visible');
          }
          
        } catch (uploadError) {
          debugLog('PHASE4', '4.3', 'error', 'File upload failed', uploadError.message);
        } finally {
          // Cleanup
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
        }
      } else {
        debugLog('PHASE4', '4.2', 'warn', 'No file input found on page');
      }
    }
    
    // Phase 5: Attachment Modal Test
    debugLog('PHASE5', '5.1', 'info', 'Testing attachment modal functionality');
    
    const attachmentButtons = await page.$$('button[title*="attachment"], button:has-text("attachments")');
    if (attachmentButtons.length > 0) {
      debugLog('PHASE5', '5.2', 'success', `Found ${attachmentButtons.length} attachment button(s)`);
      
      try {
        await attachmentButtons[0].click();
        await page.waitForTimeout(2000);
        
        const modal = await page.$('[role="dialog"]:has-text("Attachments"), [role="dialog"]:has-text("attachment")');
        if (modal) {
          debugLog('PHASE5', '5.3', 'success', 'Attachment modal opened');
          
          // Test modal content
          const attachmentItems = await page.$$('[class*="border rounded-lg p-3"]');
          debugLog('PHASE5', '5.4', 'info', `Found ${attachmentItems.length} attachment items`);
          
          // Test preview buttons
          const previewButtons = await page.$$('button:has-text("Preview")');
          const downloadButtons = await page.$$('button:has-text("Download")');
          
          debugLog('PHASE5', '5.5', 'info', `Preview buttons: ${previewButtons.length}, Download buttons: ${downloadButtons.length}`);
          
          if (previewButtons.length > 0) {
            debugLog('PHASE5', '5.6', 'info', 'Testing preview functionality');
            await previewButtons[0].click();
            await page.waitForTimeout(2000);
            
            const previewModal = await page.$$('[role="dialog"]');
            if (previewModal.length > 1) {
              debugLog('PHASE5', '5.7', 'success', 'Preview modal opened');
              
              // Close preview modal
              await page.keyboard.press('Escape');
              await page.waitForTimeout(1000);
            }
          }
          
          // Close attachment modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
          
        } else {
          debugLog('PHASE5', '5.3', 'error', 'Attachment modal failed to open');
        }
        
      } catch (modalError) {
        debugLog('PHASE5', '5.2', 'error', 'Error testing attachment modal', modalError.message);
      }
    } else {
      debugLog('PHASE5', '5.2', 'warn', 'No attachment buttons found');
    }
    
    // Final Results Summary
    console.log('\n🎯 ENHANCED DEBUG TEST RESULTS');
    console.log('==============================');
    
    const finalUrl = page.url();
    const authenticationWorking = !finalUrl.includes('/login');
    const messagesAccessible = finalUrl.includes('/messages') || finalUrl.includes('/admin') || finalUrl.includes('/team') || finalUrl.includes('/client');
    
    console.log(`✅ Server Connection: Working`);
    console.log(`${authenticationWorking ? '✅' : '❌'} Authentication: ${authenticationWorking ? 'Working' : 'Failed'}`);
    console.log(`${messagesAccessible ? '✅' : '❌'} Messages Access: ${messagesAccessible ? 'Working' : 'Failed'}`);
    console.log(`📊 Console Errors: ${errors.console.length}`);
    console.log(`📊 Network Errors: ${errors.network.length}`);
    console.log(`📊 JavaScript Errors: ${errors.javascript.length}`);
    
    if (errors.console.length > 0) {
      console.log('\n🔴 Console Errors:');
      errors.console.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.text}`);
        if (err.location) {
          console.log(`      Location: ${err.location.url}:${err.location.lineNumber}`);
        }
      });
    }
    
    if (errors.network.length > 0) {
      console.log('\n🔴 Network Errors:');
      errors.network.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.status} - ${err.url}`);
      });
    }
    
    if (errors.javascript.length > 0) {
      console.log('\n🔴 JavaScript Errors:');
      errors.javascript.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.message}`);
      });
    }
    
    // Keep browser open for manual inspection
    console.log('\n⏰ Browser will remain open for manual inspection for 30 seconds...');
    await page.waitForTimeout(30000);
    
    return {
      success: authenticationWorking && messagesAccessible,
      results: {
        authentication: authenticationWorking,
        messagesAccess: messagesAccessible,
        consoleErrors: errors.console.length,
        networkErrors: errors.network.length,
        jsErrors: errors.javascript.length
      },
      errors
    };

  } catch (error) {
    debugLog('FATAL', '0', 'error', 'Test suite crashed', error.message);
    console.log('\n💥 Test suite crashed:', error.message);
    console.log('Stack:', error.stack);
    return { success: false, error: error.message };
  } finally {
    if (context) await context.close();
    await browser.close();
  }
}

// Run the enhanced debug test
if (require.main === module) {
  runEnhancedDebugTest().then(results => {
    console.log('\n🏁 Final Test Results:', JSON.stringify(results.results || {}, null, 2));
    process.exit(results.success ? 0 : 1);
  }).catch(console.error);
}

module.exports = { runEnhancedDebugTest };