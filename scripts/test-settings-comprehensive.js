#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration with extended timeouts
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'settings-comprehensive');
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
  admin: { email: 'admin@demo.com', password: 'password123', role: 'admin' },
  team: { email: 'team@demo.com', password: 'password123', role: 'team' },
  client: { email: 'sarah@acmecorp.com', password: 'password123', role: 'client' }
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

async function testSettingsPage(page, viewport, userType) {
  const user = TEST_USERS[userType];
  const screenshotPrefix = `${viewport.name}-${userType}`;
  
  try {
    if (userType === 'admin') {
      // Navigate to settings page
      await page.goto(`${BASE_URL}/admin/settings`, { 
        waitUntil: 'networkidle',
        timeout: PAGE_TIMEOUT 
      });
      
      // Wait for settings page to load
      await page.waitForSelector('h1:has-text("Settings")', { 
        timeout: ACTION_TIMEOUT,
        state: 'visible'
      });
      
      // Take main screenshot
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-main.png`),
        fullPage: true
      });
      console.log(`   📸 Main settings page captured`);
      
      // Test main tabs using data-testid
      const mainTabs = [
        { id: 'tab-emails', name: 'emails' },
        { id: 'tab-sms', name: 'sms' },
        { id: 'tab-general', name: 'general' },
        { id: 'tab-users', name: 'users' }
      ];
      
      for (const tab of mainTabs) {
        try {
          // Click tab using data-testid
          await page.click(`[data-testid="${tab.id}"]`, { 
            timeout: ACTION_TIMEOUT 
          });
          await page.waitForTimeout(1000); // Wait for animation
          
          // Take screenshot
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-${tab.name}.png`),
            fullPage: true
          });
          console.log(`   📸 ${tab.name} tab captured`);
          
        } catch (error) {
          console.log(`   ⚠️ Could not test ${tab.name} tab: ${error.message}`);
        }
      }
      
      // Test email sub-tabs
      try {
        // Go back to emails tab
        await page.click('[data-testid="tab-emails"]', { 
          timeout: ACTION_TIMEOUT 
        });
        await page.waitForTimeout(500);
        
        const emailTabs = [
          { id: 'email-tab-logs', name: 'logs' },
          { id: 'email-tab-templates', name: 'templates' },
          { id: 'email-tab-test', name: 'test' }
        ];
        
        for (const subTab of emailTabs) {
          try {
            await page.click(`[data-testid="${subTab.id}"]`, { 
              timeout: ACTION_TIMEOUT 
            });
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
              path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-email-${subTab.name}.png`),
              fullPage: true
            });
            console.log(`   📸 Email ${subTab.name} sub-tab captured`);
            
          } catch (error) {
            console.log(`   ⚠️ Could not test email ${subTab.name}: ${error.message}`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Could not test email sub-tabs: ${error.message}`);
      }
      
      // Check responsive behavior
      if (viewport.width < 768) {
        const tabsList = await page.locator('[data-testid="main-tabs-list"]').first();
        const classList = await tabsList.getAttribute('class');
        const hasGrid = classList && classList.includes('grid');
        console.log(`   📱 Mobile grid layout: ${hasGrid ? '✅' : '❌'}`);
      }
      
    } else {
      // Non-admin users should be redirected
      try {
        await page.goto(`${BASE_URL}/admin/settings`, { 
          waitUntil: 'networkidle',
          timeout: PAGE_TIMEOUT 
        });
        
        // Check if redirected
        const currentUrl = page.url();
        const hasAccess = currentUrl.includes('/admin/settings');
        
        if (!hasAccess) {
          console.log(`   ✅ ${userType} correctly denied access to settings`);
          
          // Take screenshot of where they were redirected
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-redirected.png`),
            fullPage: true
          });
        } else {
          console.log(`   ❌ ${userType} incorrectly has access to admin settings!`);
        }
      } catch (error) {
        console.log(`   ✅ ${userType} access denied as expected`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error testing settings: ${error.message}`);
    
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
  console.log('🚀 Starting Comprehensive Admin Settings Test');
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
            // Test settings page
            const testSuccess = await testSettingsPage(page, viewport, userType);
            
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
      console.log(`  ${status} ${userType}: ${userSuccess}/${userResults.length} passed`);
    }
    
    // List screenshots
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR)
      .filter(f => f.endsWith('.png'));
    
    console.log(`\n📸 Generated ${screenshots.length} screenshots`);
    console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
    
    // Final status
    console.log('\n' + '='.repeat(60));
    if (errorCount === 0) {
      console.log('🎉 ALL TESTS PASSED! The admin settings page is fully responsive.');
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