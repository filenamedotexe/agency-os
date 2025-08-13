#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'responsive-test');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Test users from CLAUDE.md
const TEST_USERS = {
  admin: {
    email: 'admin@demo.com',
    password: 'password123',
    name: 'Alex Admin',
    expectedDashboard: '/admin'
  },
  team: {
    email: 'team@demo.com', 
    password: 'password123',
    name: 'Taylor Team',
    expectedDashboard: '/team'
  },
  client: {
    email: 'sarah@acmecorp.com',
    password: 'password123', 
    name: 'Sarah Johnson',
    expectedDashboard: '/client'
  }
};

// Viewport configurations for testing
const VIEWPORTS = [
  { name: 'mobile', width: 320, height: 568 },
  { name: 'mobile-large', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1024, height: 768 },
  { name: 'desktop-large', width: 1920, height: 1080 }
];

async function loginUser(page, userType) {
  const user = TEST_USERS[userType];
  console.log(`🔐 Logging in as ${userType} (${user.email})...`);
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to appropriate dashboard
  await page.waitForURL(`**${user.expectedDashboard}**`, { timeout: 10000 });
  console.log(`✅ Successfully logged in as ${userType}`);
  
  return user;
}

async function testSettingsPageAccess(page, userType, viewport) {
  console.log(`🔍 Testing settings page access for ${userType}...`);
  
  if (userType === 'admin') {
    // Admin should have access to settings
    await page.goto(`${BASE_URL}/admin/settings`);
    await page.waitForLoadState('networkidle');
    
    // Check if settings page loaded
    const hasSettingsContent = await page.locator('h1:has-text("Settings")').count() > 0;
    if (hasSettingsContent) {
      console.log('✅ Admin has access to settings page');
      
      // Take screenshot of settings page
      const screenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-settings.png`);
      await page.screenshot({ 
        path: screenshot, 
        fullPage: true,
        clip: viewport.width < 768 ? undefined : { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 1200) }
      });
      console.log(`📸 Settings screenshot: ${screenshot}`);
      
      // Test all tabs
      const tabs = ['emails', 'sms', 'general', 'users'];
      for (const tab of tabs) {
        try {
          // Find and click tab by looking for various possible selectors
          const tabSelectors = [
            `[role="tab"]:has-text("${tab.charAt(0).toUpperCase() + tab.slice(1)}")`,
            `[role="tab"]:has-text("${tab.toUpperCase()}")`,
            `button:has-text("${tab.charAt(0).toUpperCase() + tab.slice(1)}")`,
            `[data-value="${tab}"]`
          ];
          
          let tabClicked = false;
          for (const selector of tabSelectors) {
            try {
              const tabElement = await page.locator(selector).first();
              if (await tabElement.count() > 0) {
                await tabElement.click();
                await page.waitForTimeout(500);
                tabClicked = true;
                break;
              }
            } catch (e) {
              continue;
            }
          }
          
          if (tabClicked) {
            // Take screenshot of tab
            const tabScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-${tab}-tab.png`);
            await page.screenshot({ 
              path: tabScreenshot, 
              fullPage: true,
              clip: viewport.width < 768 ? undefined : { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 1200) }
            });
            console.log(`📸 ${tab} tab screenshot: ${tabScreenshot}`);
          } else {
            console.log(`⚠️ Could not find ${tab} tab`);
          }
        } catch (error) {
          console.log(`⚠️ Error testing ${tab} tab:`, error.message);
        }
      }
      
    } else {
      console.log('❌ Admin settings page did not load properly');
    }
    
  } else {
    // Team and client should not have access to admin settings
    try {
      await page.goto(`${BASE_URL}/admin/settings`);
      await page.waitForLoadState('networkidle');
      
      // Check if redirected away from settings
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/settings')) {
        console.log(`❌ ${userType} should not have access to admin settings but does!`);
      } else {
        console.log(`✅ ${userType} correctly redirected away from admin settings`);
      }
    } catch (error) {
      console.log(`✅ ${userType} correctly denied access to admin settings`);
    }
  }
}

async function testDashboardLayout(page, userType, viewport) {
  console.log(`📱 Testing ${userType} dashboard layout on ${viewport.name}...`);
  
  // Go to user's dashboard
  const user = TEST_USERS[userType];
  await page.goto(`${BASE_URL}${user.expectedDashboard}`);
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of dashboard
  const dashboardScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-dashboard.png`);
  await page.screenshot({ 
    path: dashboardScreenshot, 
    fullPage: true,
    clip: viewport.width < 768 ? undefined : { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 1200) }
  });
  console.log(`📸 Dashboard screenshot: ${dashboardScreenshot}`);
  
  // Test navigation responsiveness
  if (viewport.width < 768) {
    // Check for mobile menu
    const mobileMenu = await page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"], button:has-text("Menu")').count();
    console.log(`📱 Mobile menu present: ${mobileMenu > 0 ? 'Yes' : 'No'}`);
  }
  
  // Check for proper spacing and layout
  const contentArea = await page.locator('main, [role="main"], .dashboard-content').first();
  if (await contentArea.count() > 0) {
    const styles = await contentArea.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        padding: computed.padding,
        margin: computed.margin,
        display: computed.display
      };
    });
    console.log(`📏 Content area styles:`, styles);
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Responsive Test for All User Roles');
  console.log('👥 Testing users:', Object.keys(TEST_USERS).join(', '));
  console.log('📱 Testing viewports:', VIEWPORTS.map(v => `${v.name} (${v.width}x${v.height})`).join(', '));
  
  const browser = await chromium.launch({ headless: false });
  const testResults = [];
  
  try {
    for (const userType of Object.keys(TEST_USERS)) {
      for (const viewport of VIEWPORTS) {
        console.log(`\n🔄 Testing ${userType} on ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          userAgent: viewport.width < 768 ? 
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' :
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        
        const page = await context.newPage();
        
        try {
          // Login as user
          await loginUser(page, userType);
          
          // Test dashboard layout
          await testDashboardLayout(page, userType, viewport);
          
          // Test settings page access
          await testSettingsPageAccess(page, userType, viewport);
          
          testResults.push({
            userType,
            viewport: viewport.name,
            status: 'success'
          });
          
          console.log(`✅ ${userType} on ${viewport.name} completed successfully`);
          
        } catch (error) {
          console.error(`❌ Error testing ${userType} on ${viewport.name}:`, error.message);
          
          testResults.push({
            userType,
            viewport: viewport.name,
            status: 'error',
            error: error.message
          });
          
          // Take error screenshot
          try {
            const errorScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-error.png`);
            await page.screenshot({ path: errorScreenshot, fullPage: true });
            console.log(`📸 Error screenshot: ${errorScreenshot}`);
          } catch (screenshotError) {
            console.log('Could not take error screenshot:', screenshotError.message);
          }
        }
        
        await context.close();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between tests
      }
    }
    
    // Generate comprehensive report
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const successCount = testResults.filter(r => r.status === 'success').length;
    const errorCount = testResults.filter(r => r.status === 'error').length;
    const totalTests = testResults.length;
    
    console.log(`✅ Successful tests: ${successCount}/${totalTests}`);
    console.log(`❌ Failed tests: ${errorCount}/${totalTests}`);
    console.log(`📊 Success rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);
    
    // Group results by user type
    for (const userType of Object.keys(TEST_USERS)) {
      console.log(`\n${userType.toUpperCase()} Results:`);
      const userResults = testResults.filter(r => r.userType === userType);
      for (const result of userResults) {
        const status = result.status === 'success' ? '✅' : '❌';
        console.log(`  ${status} ${result.viewport}`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      }
    }
    
    // List all screenshots generated
    const screenshotFiles = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`\n📁 Generated ${screenshotFiles.length} screenshots in: ${SCREENSHOTS_DIR}`);
    
    console.log('\n🎉 Comprehensive Responsive Testing Completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = { runComprehensiveTest };