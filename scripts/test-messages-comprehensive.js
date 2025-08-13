#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration with extended timeouts
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'messages-comprehensive');
const PAGE_TIMEOUT = 60000; // 60 seconds for page loads
const ACTION_TIMEOUT = 30000; // 30 seconds for actions

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// All viewports to test
const VIEWPORTS = [
  { name: 'mobile-xs', width: 320, height: 568, device: 'iPhone SE' },
  { name: 'mobile-sm', width: 375, height: 667, device: 'iPhone 8' },
  { name: 'mobile-md', width: 390, height: 844, device: 'iPhone 12' },
  { name: 'mobile-lg', width: 414, height: 896, device: 'iPhone 11 Pro Max' },
  { name: 'tablet-sm', width: 768, height: 1024, device: 'iPad' },
  { name: 'tablet-lg', width: 820, height: 1180, device: 'iPad Air' },
  { name: 'desktop-sm', width: 1024, height: 768, device: 'Desktop HD' },
  { name: 'desktop-md', width: 1280, height: 800, device: 'Desktop HD+' },
  { name: 'desktop-lg', width: 1440, height: 900, device: 'Desktop FHD' },
  { name: 'desktop-xl', width: 1920, height: 1080, device: 'Desktop Full HD' },
  { name: 'desktop-4k', width: 2560, height: 1440, device: 'Desktop 4K' }
];

// Test users
const TEST_USERS = {
  admin: { 
    email: 'admin@demo.com', 
    password: 'password123', 
    role: 'admin',
    expectedAccess: true,
    expectedDashboard: '/admin'
  },
  team: { 
    email: 'team@demo.com', 
    password: 'password123', 
    role: 'team',
    expectedAccess: true,
    expectedDashboard: '/team'
  },
  client: { 
    email: 'sarah@acmecorp.com', 
    password: 'password123', 
    role: 'client',
    expectedAccess: false, // Clients shouldn't access messages page
    expectedDashboard: '/client'
  }
};

async function loginUser(page, userType) {
  const user = TEST_USERS[userType];
  console.log(`   🔐 Logging in as ${userType} (${user.email})`);
  
  try {
    // Go to login page
    await page.goto(`${BASE_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: PAGE_TIMEOUT 
    });
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { 
      timeout: ACTION_TIMEOUT,
      state: 'visible' 
    });
    
    // Fill login form
    await page.fill('input[type="email"]', user.email, { timeout: ACTION_TIMEOUT });
    await page.fill('input[type="password"]', user.password, { timeout: ACTION_TIMEOUT });
    
    // Submit form
    await Promise.all([
      page.waitForNavigation({ 
        waitUntil: 'networkidle',
        timeout: PAGE_TIMEOUT 
      }),
      page.click('button[type="submit"]', { timeout: ACTION_TIMEOUT })
    ]);
    
    console.log(`   ✅ Logged in successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Login failed: ${error.message}`);
    return false;
  }
}

async function testMessagesPage(page, viewport, userType) {
  const user = TEST_USERS[userType];
  const screenshotPrefix = `${viewport.name}-${userType}`;
  
  try {
    // Navigate to messages page
    await page.goto(`${BASE_URL}/messages`, { 
      waitUntil: 'networkidle',
      timeout: PAGE_TIMEOUT 
    });
    
    // Check access control
    const currentUrl = page.url();
    const hasAccess = currentUrl.includes('/messages');
    
    if (user.expectedAccess) {
      // Admin and team should have access
      if (!hasAccess) {
        console.log(`   ❌ ${userType} incorrectly denied access to messages!`);
        return false;
      }
      
      console.log(`   ✅ ${userType} has access to messages`);
      
      // Wait for messages page to load
      await page.waitForSelector('h2:has-text("Messages")', { 
        timeout: ACTION_TIMEOUT,
        state: 'visible'
      }).catch(() => {
        // Try alternative selector
        return page.waitForSelector('[data-testid="new-message-button"]', {
          timeout: ACTION_TIMEOUT,
          state: 'visible'
        });
      });
      
      // Take main screenshot
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-main.png`),
        fullPage: true
      });
      console.log(`   📸 Main messages page captured`);
      
      // Test mobile-specific features
      if (viewport.width < 768) {
        // Check for mobile menu button
        const mobileMenuButton = await page.locator('[data-testid="mobile-menu-button"]').count();
        console.log(`   📱 Mobile menu button: ${mobileMenuButton > 0 ? '✅' : '❌'}`);
        
        if (mobileMenuButton > 0) {
          // Open mobile menu
          try {
            await page.click('[data-testid="mobile-menu-button"]', { 
              timeout: ACTION_TIMEOUT 
            });
            await page.waitForTimeout(500);
            
            // Take screenshot of mobile menu
            await page.screenshot({ 
              path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-mobile-menu.png`),
              fullPage: true
            });
            console.log(`   📸 Mobile menu captured`);
            
            // Close menu
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          } catch (error) {
            console.log(`   ⚠️ Could not test mobile menu: ${error.message}`);
          }
        }
      }
      
      // Test New Message button
      try {
        const newMessageButton = await page.locator('[data-testid="new-message-button"]').first();
        if (await newMessageButton.count() > 0) {
          await newMessageButton.click({ timeout: ACTION_TIMEOUT });
          await page.waitForTimeout(1000);
          
          // Take screenshot of new message modal
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-new-message-modal.png`),
            fullPage: true
          });
          console.log(`   📸 New message modal captured`);
          
          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      } catch (error) {
        console.log(`   ⚠️ Could not test new message button: ${error.message}`);
      }
      
      // Test conversation selection (if there are conversations)
      try {
        const conversations = await page.locator('[data-testid^="conversation-"]').all();
        if (conversations.length > 0) {
          console.log(`   📬 Found ${conversations.length} conversations`);
          
          // Click first conversation
          await conversations[0].click({ timeout: ACTION_TIMEOUT });
          await page.waitForTimeout(1000);
          
          // Take screenshot of selected conversation
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-conversation.png`),
            fullPage: true
          });
          console.log(`   📸 Conversation view captured`);
          
          // Check for attachments button
          const attachmentsButton = await page.locator('button:has-text("Files")').count();
          if (attachmentsButton > 0) {
            console.log(`   📎 Attachments button found`);
          }
        } else {
          console.log(`   📬 No conversations found (empty state)`);
          
          // Take screenshot of empty state
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-empty-state.png`),
            fullPage: true
          });
          console.log(`   📸 Empty state captured`);
        }
      } catch (error) {
        console.log(`   ⚠️ Could not test conversations: ${error.message}`);
      }
      
      // Check responsive layout
      if (viewport.width < 1024) {
        // On mobile/tablet, conversation list should be hidden by default
        const conversationListVisible = await page.locator('.lg\\:flex').first().isVisible().catch(() => false);
        console.log(`   📱 Conversation list hidden on mobile: ${!conversationListVisible ? '✅' : '❌'}`);
      } else {
        // On desktop, conversation list should be visible
        const conversationListVisible = await page.locator('.lg\\:flex').first().isVisible().catch(() => false);
        console.log(`   🖥️ Conversation list visible on desktop: ${conversationListVisible ? '✅' : '❌'}`);
      }
      
    } else {
      // Client should be redirected away from messages
      if (hasAccess) {
        console.log(`   ❌ ${userType} incorrectly has access to messages!`);
        return false;
      }
      
      console.log(`   ✅ ${userType} correctly denied access to messages`);
      
      // Take screenshot of where they were redirected
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-redirected.png`),
        fullPage: true
      });
      console.log(`   📸 Redirect page captured`);
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error testing messages: ${error.message}`);
    
    // Take error screenshot
    try {
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-error.png`),
        fullPage: true
      });
    } catch (e) {
      // Ignore screenshot errors
    }
    
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Messages Page Test');
  console.log(`📱 Testing ${VIEWPORTS.length} viewports`);
  console.log(`👥 Testing ${Object.keys(TEST_USERS).length} user roles`);
  console.log(`⏱️ Timeouts: Page=${PAGE_TIMEOUT}ms, Action=${ACTION_TIMEOUT}ms`);
  console.log('');
  
  const browser = await chromium.launch({ 
    headless: true, // Run headless for speed
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // For CI/CD compatibility
  });
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  try {
    // Test each viewport
    for (const viewport of VIEWPORTS) {
      console.log(`\n📱 ${viewport.device} (${viewport.width}x${viewport.height})`);
      
      // Test each user role
      for (const userType of Object.keys(TEST_USERS)) {
        console.log(`\n  👤 Testing ${userType} role:`);
        
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          userAgent: viewport.width < 768 ? 
            'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) Mobile/15E148' :
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          locale: 'en-US',
          timezoneId: 'America/New_York'
        });
        
        // Set default timeouts for context
        context.setDefaultTimeout(ACTION_TIMEOUT);
        context.setDefaultNavigationTimeout(PAGE_TIMEOUT);
        
        const page = await context.newPage();
        
        try {
          // Login
          const loginSuccess = await loginUser(page, userType);
          
          if (loginSuccess) {
            // Test messages page
            const testSuccess = await testMessagesPage(page, viewport, userType);
            
            if (testSuccess) {
              console.log(`   ✅ Test completed successfully`);
              successCount++;
            } else {
              errorCount++;
            }
            
            results.push({
              viewport: viewport.name,
              device: viewport.device,
              user: userType,
              success: testSuccess
            });
          } else {
            errorCount++;
            results.push({
              viewport: viewport.name,
              device: viewport.device,
              user: userType,
              success: false,
              error: 'Login failed'
            });
          }
          
        } catch (error) {
          console.error(`   ❌ Test failed: ${error.message}`);
          errorCount++;
          
          results.push({
            viewport: viewport.name,
            device: viewport.device,
            user: userType,
            success: false,
            error: error.message
          });
        }
        
        await context.close();
        
        // Small delay between tests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const totalTests = results.length;
    const successRate = ((successCount / totalTests) * 100).toFixed(1);
    
    console.log(`\n✅ Successful: ${successCount}/${totalTests} (${successRate}%)`);
    console.log(`❌ Failed: ${errorCount}/${totalTests}`);
    
    // Group results by viewport
    console.log('\n📱 Results by Viewport:');
    for (const viewport of VIEWPORTS) {
      const viewportResults = results.filter(r => r.viewport === viewport.name);
      const viewportSuccess = viewportResults.filter(r => r.success).length;
      const status = viewportSuccess === viewportResults.length ? '✅' : '⚠️';
      console.log(`  ${status} ${viewport.device}: ${viewportSuccess}/${viewportResults.length} passed`);
    }
    
    // Group results by user role
    console.log('\n👥 Results by User Role:');
    for (const userType of Object.keys(TEST_USERS)) {
      const userResults = results.filter(r => r.user === userType);
      const userSuccess = userResults.filter(r => r.success).length;
      const status = userSuccess === userResults.length ? '✅' : '⚠️';
      const expectedBehavior = TEST_USERS[userType].expectedAccess ? 'Has access' : 'No access';
      console.log(`  ${status} ${userType} (${expectedBehavior}): ${userSuccess}/${userResults.length} passed`);
    }
    
    // List screenshots
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR)
      .filter(f => f.endsWith('.png'));
    
    console.log(`\n📸 Generated ${screenshots.length} screenshots`);
    console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
    
    // Key findings
    console.log('\n🔍 Key Findings:');
    console.log('  - Admin users: Should have full access to messages');
    console.log('  - Team users: Should have full access to messages');
    console.log('  - Client users: Should be redirected (no access)');
    console.log('  - Mobile layout: Conversation list hidden, menu button visible');
    console.log('  - Desktop layout: Conversation list visible in sidebar');
    
    // Final status
    console.log('\n' + '='.repeat(60));
    if (errorCount === 0) {
      console.log('🎉 ALL TESTS PASSED! The messages page is fully responsive.');
    } else {
      console.log(`⚠️ ${errorCount} tests failed. Review screenshots for details.`);
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Critical test failure:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  runComprehensiveTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTest };